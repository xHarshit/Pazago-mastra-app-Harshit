import { createClient } from '@libsql/client';
import { a as TABLE_WORKFLOW_SNAPSHOT, b as TABLE_EVALS, c as TABLE_MESSAGES, d as TABLE_THREADS, e as TABLE_TRACES, f as TABLE_SCHEMAS, g as TABLE_RESOURCES } from './core.mjs';
import { M as MastraBase, p as parseSqlIdentifier } from './utils.mjs';
import { M as MastraError, E as ErrorCategory, a as ErrorDomain } from './chunk-6UNGH46J.mjs';
import { M as MessageList } from './chunk-2H5YEBCO.mjs';

// src/storage/base.ts
var MastraStorage = class extends MastraBase {
  /** @deprecated import from { TABLE_WORKFLOW_SNAPSHOT } '@mastra/core/storage' instead */
  static TABLE_WORKFLOW_SNAPSHOT = TABLE_WORKFLOW_SNAPSHOT;
  /** @deprecated import from { TABLE_EVALS } '@mastra/core/storage' instead */
  static TABLE_EVALS = TABLE_EVALS;
  /** @deprecated import from { TABLE_MESSAGES } '@mastra/core/storage' instead */
  static TABLE_MESSAGES = TABLE_MESSAGES;
  /** @deprecated import from { TABLE_THREADS } '@mastra/core/storage' instead */
  static TABLE_THREADS = TABLE_THREADS;
  /** @deprecated import { TABLE_TRACES } from '@mastra/core/storage' instead */
  static TABLE_TRACES = TABLE_TRACES;
  hasInitialized = null;
  shouldCacheInit = true;
  constructor({ name }) {
    super({
      component: "STORAGE",
      name
    });
  }
  get supports() {
    return {
      selectByIncludeResourceScope: false,
      resourceWorkingMemory: false
    };
  }
  ensureDate(date) {
    if (!date) return void 0;
    return date instanceof Date ? date : new Date(date);
  }
  serializeDate(date) {
    if (!date) return void 0;
    const dateObj = this.ensureDate(date);
    return dateObj?.toISOString();
  }
  /**
   * Resolves limit for how many messages to fetch
   *
   * @param last The number of messages to fetch
   * @param defaultLimit The default limit to use if last is not provided
   * @returns The resolved limit
   */
  resolveMessageLimit({
    last,
    defaultLimit
  }) {
    if (typeof last === "number") return Math.max(0, last);
    if (last === false) return 0;
    return defaultLimit;
  }
  getSqlType(type) {
    switch (type) {
      case "text":
        return "TEXT";
      case "timestamp":
        return "TIMESTAMP";
      case "integer":
        return "INTEGER";
      case "bigint":
        return "BIGINT";
      case "jsonb":
        return "JSONB";
      default:
        return "TEXT";
    }
  }
  getDefaultValue(type) {
    switch (type) {
      case "text":
      case "uuid":
        return "DEFAULT ''";
      case "timestamp":
        return "DEFAULT '1970-01-01 00:00:00'";
      case "integer":
      case "bigint":
        return "DEFAULT 0";
      case "jsonb":
        return "DEFAULT '{}'";
      default:
        return "DEFAULT ''";
    }
  }
  batchTraceInsert({ records }) {
    return this.batchInsert({ tableName: TABLE_TRACES, records });
  }
  async getResourceById(_) {
    throw new Error(
      `Resource working memory is not supported by this storage adapter (${this.constructor.name}). Supported storage adapters: LibSQL (@mastra/libsql), PostgreSQL (@mastra/pg), Upstash (@mastra/upstash). To use per-resource working memory, switch to one of these supported storage adapters.`
    );
  }
  async saveResource(_) {
    throw new Error(
      `Resource working memory is not supported by this storage adapter (${this.constructor.name}). Supported storage adapters: LibSQL (@mastra/libsql), PostgreSQL (@mastra/pg), Upstash (@mastra/upstash). To use per-resource working memory, switch to one of these supported storage adapters.`
    );
  }
  async updateResource(_) {
    throw new Error(
      `Resource working memory is not supported by this storage adapter (${this.constructor.name}). Supported storage adapters: LibSQL (@mastra/libsql), PostgreSQL (@mastra/pg), Upstash (@mastra/upstash). To use per-resource working memory, switch to one of these supported storage adapters.`
    );
  }
  async init() {
    if (this.shouldCacheInit && await this.hasInitialized) {
      return;
    }
    const tableCreationTasks = [
      this.createTable({
        tableName: TABLE_WORKFLOW_SNAPSHOT,
        schema: TABLE_SCHEMAS[TABLE_WORKFLOW_SNAPSHOT]
      }),
      this.createTable({
        tableName: TABLE_EVALS,
        schema: TABLE_SCHEMAS[TABLE_EVALS]
      }),
      this.createTable({
        tableName: TABLE_THREADS,
        schema: TABLE_SCHEMAS[TABLE_THREADS]
      }),
      this.createTable({
        tableName: TABLE_MESSAGES,
        schema: TABLE_SCHEMAS[TABLE_MESSAGES]
      }),
      this.createTable({
        tableName: TABLE_TRACES,
        schema: TABLE_SCHEMAS[TABLE_TRACES]
      })
    ];
    if (this.supports.resourceWorkingMemory) {
      tableCreationTasks.push(
        this.createTable({
          tableName: TABLE_RESOURCES,
          schema: TABLE_SCHEMAS[TABLE_RESOURCES]
        })
      );
    }
    this.hasInitialized = Promise.all(tableCreationTasks).then(() => true);
    await this.hasInitialized;
    await this?.alterTable?.({
      tableName: TABLE_MESSAGES,
      schema: TABLE_SCHEMAS[TABLE_MESSAGES],
      ifNotExists: ["resourceId"]
    });
  }
  async persistWorkflowSnapshot({
    workflowName,
    runId,
    snapshot
  }) {
    await this.init();
    const data = {
      workflow_name: workflowName,
      run_id: runId,
      snapshot,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.logger.debug("Persisting workflow snapshot", { workflowName, runId, data });
    await this.insert({
      tableName: TABLE_WORKFLOW_SNAPSHOT,
      record: data
    });
  }
  async loadWorkflowSnapshot({
    workflowName,
    runId
  }) {
    if (!this.hasInitialized) {
      await this.init();
    }
    this.logger.debug("Loading workflow snapshot", { workflowName, runId });
    const d = await this.load({
      tableName: TABLE_WORKFLOW_SNAPSHOT,
      keys: { workflow_name: workflowName, run_id: runId }
    });
    return d ? d.snapshot : null;
  }
};

function safelyParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return {};
  }
}
var LibSQLStore = class extends MastraStorage {
  client;
  maxRetries;
  initialBackoffMs;
  constructor(config) {
    super({ name: `LibSQLStore` });
    this.maxRetries = config.maxRetries ?? 5;
    this.initialBackoffMs = config.initialBackoffMs ?? 100;
    if (config.url.endsWith(":memory:")) {
      this.shouldCacheInit = false;
    }
    this.client = createClient(config);
    if (config.url.startsWith("file:") || config.url.includes(":memory:")) {
      this.client.execute("PRAGMA journal_mode=WAL;").then(() => this.logger.debug("LibSQLStore: PRAGMA journal_mode=WAL set.")).catch((err) => this.logger.warn("LibSQLStore: Failed to set PRAGMA journal_mode=WAL.", err));
      this.client.execute("PRAGMA busy_timeout = 5000;").then(() => this.logger.debug("LibSQLStore: PRAGMA busy_timeout=5000 set.")).catch((err) => this.logger.warn("LibSQLStore: Failed to set PRAGMA busy_timeout.", err));
    }
  }
  get supports() {
    return {
      selectByIncludeResourceScope: true,
      resourceWorkingMemory: true
    };
  }
  getCreateTableSQL(tableName, schema) {
    const parsedTableName = parseSqlIdentifier(tableName, "table name");
    const columns = Object.entries(schema).map(([name, col]) => {
      const parsedColumnName = parseSqlIdentifier(name, "column name");
      let type = col.type.toUpperCase();
      if (type === "TEXT") type = "TEXT";
      if (type === "TIMESTAMP") type = "TEXT";
      const nullable = col.nullable ? "" : "NOT NULL";
      const primaryKey = col.primaryKey ? "PRIMARY KEY" : "";
      return `${parsedColumnName} ${type} ${nullable} ${primaryKey}`.trim();
    });
    if (tableName === TABLE_WORKFLOW_SNAPSHOT) {
      const stmnt = `CREATE TABLE IF NOT EXISTS ${parsedTableName} (
                ${columns.join(",\n")},
                PRIMARY KEY (workflow_name, run_id)
            )`;
      return stmnt;
    }
    return `CREATE TABLE IF NOT EXISTS ${parsedTableName} (${columns.join(", ")})`;
  }
  async createTable({
    tableName,
    schema
  }) {
    try {
      this.logger.debug(`Creating database table`, { tableName, operation: "schema init" });
      const sql = this.getCreateTableSQL(tableName, schema);
      await this.client.execute(sql);
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_CREATE_TABLE_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            tableName
          }
        },
        error
      );
    }
  }
  getSqlType(type) {
    switch (type) {
      case "bigint":
        return "INTEGER";
      // SQLite uses INTEGER for all integer sizes
      case "jsonb":
        return "TEXT";
      // Store JSON as TEXT in SQLite
      default:
        return super.getSqlType(type);
    }
  }
  /**
   * Alters table schema to add columns if they don't exist
   * @param tableName Name of the table
   * @param schema Schema of the table
   * @param ifNotExists Array of column names to add if they don't exist
   */
  async alterTable({
    tableName,
    schema,
    ifNotExists
  }) {
    const parsedTableName = parseSqlIdentifier(tableName, "table name");
    try {
      const pragmaQuery = `PRAGMA table_info(${parsedTableName})`;
      const result = await this.client.execute(pragmaQuery);
      const existingColumnNames = new Set(result.rows.map((row) => row.name.toLowerCase()));
      for (const columnName of ifNotExists) {
        if (!existingColumnNames.has(columnName.toLowerCase()) && schema[columnName]) {
          const columnDef = schema[columnName];
          const sqlType = this.getSqlType(columnDef.type);
          const nullable = columnDef.nullable === false ? "NOT NULL" : "";
          const defaultValue = columnDef.nullable === false ? this.getDefaultValue(columnDef.type) : "";
          const alterSql = `ALTER TABLE ${parsedTableName} ADD COLUMN "${columnName}" ${sqlType} ${nullable} ${defaultValue}`.trim();
          await this.client.execute(alterSql);
          this.logger?.debug?.(`Added column ${columnName} to table ${parsedTableName}`);
        }
      }
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_ALTER_TABLE_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            tableName
          }
        },
        error
      );
    }
  }
  async clearTable({ tableName }) {
    const parsedTableName = parseSqlIdentifier(tableName, "table name");
    try {
      await this.client.execute(`DELETE FROM ${parsedTableName}`);
    } catch (e) {
      const mastraError = new MastraError(
        {
          id: "LIBSQL_STORE_CLEAR_TABLE_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            tableName
          }
        },
        e
      );
      this.logger?.trackException?.(mastraError);
      this.logger?.error?.(mastraError.toString());
    }
  }
  prepareStatement({ tableName, record }) {
    const parsedTableName = parseSqlIdentifier(tableName, "table name");
    const columns = Object.keys(record).map((col) => parseSqlIdentifier(col, "column name"));
    const values = Object.values(record).map((v) => {
      if (typeof v === `undefined`) {
        return null;
      }
      if (v instanceof Date) {
        return v.toISOString();
      }
      return typeof v === "object" ? JSON.stringify(v) : v;
    });
    const placeholders = values.map(() => "?").join(", ");
    return {
      sql: `INSERT OR REPLACE INTO ${parsedTableName} (${columns.join(", ")}) VALUES (${placeholders})`,
      args: values
    };
  }
  async executeWriteOperationWithRetry(operationFn, operationDescription) {
    let retries = 0;
    while (true) {
      try {
        return await operationFn();
      } catch (error) {
        if (error.message && (error.message.includes("SQLITE_BUSY") || error.message.includes("database is locked")) && retries < this.maxRetries) {
          retries++;
          const backoffTime = this.initialBackoffMs * Math.pow(2, retries - 1);
          this.logger.warn(
            `LibSQLStore: Encountered SQLITE_BUSY during ${operationDescription}. Retrying (${retries}/${this.maxRetries}) in ${backoffTime}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        } else {
          this.logger.error(`LibSQLStore: Error during ${operationDescription} after ${retries} retries: ${error}`);
          throw error;
        }
      }
    }
  }
  insert(args) {
    return this.executeWriteOperationWithRetry(() => this.doInsert(args), `insert into table ${args.tableName}`);
  }
  async doInsert({
    tableName,
    record
  }) {
    await this.client.execute(
      this.prepareStatement({
        tableName,
        record
      })
    );
  }
  batchInsert(args) {
    return this.executeWriteOperationWithRetry(
      () => this.doBatchInsert(args),
      `batch insert into table ${args.tableName}`
    ).catch((error) => {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_BATCH_INSERT_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            tableName: args.tableName
          }
        },
        error
      );
    });
  }
  async doBatchInsert({
    tableName,
    records
  }) {
    if (records.length === 0) return;
    const batchStatements = records.map((r) => this.prepareStatement({ tableName, record: r }));
    await this.client.batch(batchStatements, "write");
  }
  async load({ tableName, keys }) {
    const parsedTableName = parseSqlIdentifier(tableName, "table name");
    const parsedKeys = Object.keys(keys).map((key) => parseSqlIdentifier(key, "column name"));
    const conditions = parsedKeys.map((key) => `${key} = ?`).join(" AND ");
    const values = Object.values(keys);
    const result = await this.client.execute({
      sql: `SELECT * FROM ${parsedTableName} WHERE ${conditions} ORDER BY createdAt DESC LIMIT 1`,
      args: values
    });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    const parsed = Object.fromEntries(
      Object.entries(row || {}).map(([k, v]) => {
        try {
          return [k, typeof v === "string" ? v.startsWith("{") || v.startsWith("[") ? JSON.parse(v) : v : v];
        } catch {
          return [k, v];
        }
      })
    );
    return parsed;
  }
  async getThreadById({ threadId }) {
    try {
      const result = await this.load({
        tableName: TABLE_THREADS,
        keys: { id: threadId }
      });
      if (!result) {
        return null;
      }
      return {
        ...result,
        metadata: typeof result.metadata === "string" ? JSON.parse(result.metadata) : result.metadata
      };
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_GET_THREAD_BY_ID_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: { threadId }
        },
        error
      );
    }
  }
  /**
   * @deprecated use getThreadsByResourceIdPaginated instead for paginated results.
   */
  async getThreadsByResourceId(args) {
    const { resourceId } = args;
    try {
      const baseQuery = `FROM ${TABLE_THREADS} WHERE resourceId = ?`;
      const queryParams = [resourceId];
      const mapRowToStorageThreadType = (row) => ({
        id: row.id,
        resourceId: row.resourceId,
        title: row.title,
        createdAt: new Date(row.createdAt),
        // Convert string to Date
        updatedAt: new Date(row.updatedAt),
        // Convert string to Date
        metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata
      });
      const result = await this.client.execute({
        sql: `SELECT * ${baseQuery} ORDER BY createdAt DESC`,
        args: queryParams
      });
      if (!result.rows) {
        return [];
      }
      return result.rows.map(mapRowToStorageThreadType);
    } catch (error) {
      const mastraError = new MastraError(
        {
          id: "LIBSQL_STORE_GET_THREADS_BY_RESOURCE_ID_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: { resourceId }
        },
        error
      );
      this.logger?.trackException?.(mastraError);
      this.logger?.error?.(mastraError.toString());
      return [];
    }
  }
  async getThreadsByResourceIdPaginated(args) {
    const { resourceId, page = 0, perPage = 100 } = args;
    try {
      const baseQuery = `FROM ${TABLE_THREADS} WHERE resourceId = ?`;
      const queryParams = [resourceId];
      const mapRowToStorageThreadType = (row) => ({
        id: row.id,
        resourceId: row.resourceId,
        title: row.title,
        createdAt: new Date(row.createdAt),
        // Convert string to Date
        updatedAt: new Date(row.updatedAt),
        // Convert string to Date
        metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata
      });
      const currentOffset = page * perPage;
      const countResult = await this.client.execute({
        sql: `SELECT COUNT(*) as count ${baseQuery}`,
        args: queryParams
      });
      const total = Number(countResult.rows?.[0]?.count ?? 0);
      if (total === 0) {
        return {
          threads: [],
          total: 0,
          page,
          perPage,
          hasMore: false
        };
      }
      const dataResult = await this.client.execute({
        sql: `SELECT * ${baseQuery} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        args: [...queryParams, perPage, currentOffset]
      });
      const threads = (dataResult.rows || []).map(mapRowToStorageThreadType);
      return {
        threads,
        total,
        page,
        perPage,
        hasMore: currentOffset + threads.length < total
      };
    } catch (error) {
      const mastraError = new MastraError(
        {
          id: "LIBSQL_STORE_GET_THREADS_BY_RESOURCE_ID_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: { resourceId }
        },
        error
      );
      this.logger?.trackException?.(mastraError);
      this.logger?.error?.(mastraError.toString());
      return { threads: [], total: 0, page, perPage, hasMore: false };
    }
  }
  async saveThread({ thread }) {
    try {
      await this.insert({
        tableName: TABLE_THREADS,
        record: {
          ...thread,
          metadata: JSON.stringify(thread.metadata)
        }
      });
      return thread;
    } catch (error) {
      const mastraError = new MastraError(
        {
          id: "LIBSQL_STORE_SAVE_THREAD_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: { threadId: thread.id }
        },
        error
      );
      this.logger?.trackException?.(mastraError);
      this.logger?.error?.(mastraError.toString());
      throw mastraError;
    }
  }
  async updateThread({
    id,
    title,
    metadata
  }) {
    const thread = await this.getThreadById({ threadId: id });
    if (!thread) {
      throw new MastraError({
        id: "LIBSQL_STORE_UPDATE_THREAD_FAILED_THREAD_NOT_FOUND",
        domain: ErrorDomain.STORAGE,
        category: ErrorCategory.USER,
        text: `Thread ${id} not found`,
        details: { threadId: id }
      });
    }
    const updatedThread = {
      ...thread,
      title,
      metadata: {
        ...thread.metadata,
        ...metadata
      }
    };
    try {
      await this.client.execute({
        sql: `UPDATE ${TABLE_THREADS} SET title = ?, metadata = ? WHERE id = ?`,
        args: [title, JSON.stringify(updatedThread.metadata), id]
      });
      return updatedThread;
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_UPDATE_THREAD_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          text: `Failed to update thread ${id}`,
          details: { threadId: id }
        },
        error
      );
    }
  }
  async deleteThread({ threadId }) {
    try {
      await this.client.execute({
        sql: `DELETE FROM ${TABLE_MESSAGES} WHERE thread_id = ?`,
        args: [threadId]
      });
      await this.client.execute({
        sql: `DELETE FROM ${TABLE_THREADS} WHERE id = ?`,
        args: [threadId]
      });
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_DELETE_THREAD_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: { threadId }
        },
        error
      );
    }
  }
  parseRow(row) {
    let content = row.content;
    try {
      content = JSON.parse(row.content);
    } catch {
    }
    const result = {
      id: row.id,
      content,
      role: row.role,
      createdAt: new Date(row.createdAt),
      threadId: row.thread_id,
      resourceId: row.resourceId
    };
    if (row.type && row.type !== `v2`) result.type = row.type;
    return result;
  }
  async _getIncludedMessages({
    threadId,
    selectBy
  }) {
    const include = selectBy?.include;
    if (!include) return null;
    const unionQueries = [];
    const params = [];
    for (const inc of include) {
      const { id, withPreviousMessages = 0, withNextMessages = 0 } = inc;
      const searchId = inc.threadId || threadId;
      unionQueries.push(
        `
            SELECT * FROM (
              WITH numbered_messages AS (
                SELECT
                  id, content, role, type, "createdAt", thread_id, "resourceId",
                  ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) as row_num
                FROM "${TABLE_MESSAGES}"
                WHERE thread_id = ?
              ),
              target_positions AS (
                SELECT row_num as target_pos
                FROM numbered_messages
                WHERE id = ?
              )
              SELECT DISTINCT m.*
              FROM numbered_messages m
              CROSS JOIN target_positions t
              WHERE m.row_num BETWEEN (t.target_pos - ?) AND (t.target_pos + ?)
            ) 
            `
        // Keep ASC for final sorting after fetching context
      );
      params.push(searchId, id, withPreviousMessages, withNextMessages);
    }
    const finalQuery = unionQueries.join(" UNION ALL ") + ' ORDER BY "createdAt" ASC';
    const includedResult = await this.client.execute({ sql: finalQuery, args: params });
    const includedRows = includedResult.rows?.map((row) => this.parseRow(row));
    const seen = /* @__PURE__ */ new Set();
    const dedupedRows = includedRows.filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
    return dedupedRows;
  }
  async getMessages({
    threadId,
    selectBy,
    format
  }) {
    try {
      const messages = [];
      const limit = this.resolveMessageLimit({ last: selectBy?.last, defaultLimit: 40 });
      if (selectBy?.include?.length) {
        const includeMessages = await this._getIncludedMessages({ threadId, selectBy });
        if (includeMessages) {
          messages.push(...includeMessages);
        }
      }
      const excludeIds = messages.map((m) => m.id);
      const remainingSql = `
        SELECT 
          id, 
          content, 
          role, 
          type,
          "createdAt", 
          thread_id,
          "resourceId"
        FROM "${TABLE_MESSAGES}"
        WHERE thread_id = ?
        ${excludeIds.length ? `AND id NOT IN (${excludeIds.map(() => "?").join(", ")})` : ""}
        ORDER BY "createdAt" DESC
        LIMIT ?
      `;
      const remainingArgs = [threadId, ...excludeIds.length ? excludeIds : [], limit];
      const remainingResult = await this.client.execute({ sql: remainingSql, args: remainingArgs });
      if (remainingResult.rows) {
        messages.push(...remainingResult.rows.map((row) => this.parseRow(row)));
      }
      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const list = new MessageList().add(messages, "memory");
      if (format === `v2`) return list.get.all.v2();
      return list.get.all.v1();
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_GET_MESSAGES_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: { threadId }
        },
        error
      );
    }
  }
  async getMessagesPaginated(args) {
    const { threadId, format, selectBy } = args;
    const { page = 0, perPage: perPageInput, dateRange } = selectBy?.pagination || {};
    const perPage = perPageInput !== void 0 ? perPageInput : this.resolveMessageLimit({ last: selectBy?.last, defaultLimit: 40 });
    const fromDate = dateRange?.start;
    const toDate = dateRange?.end;
    const messages = [];
    if (selectBy?.include?.length) {
      try {
        const includeMessages = await this._getIncludedMessages({ threadId, selectBy });
        if (includeMessages) {
          messages.push(...includeMessages);
        }
      } catch (error) {
        throw new MastraError(
          {
            id: "LIBSQL_STORE_GET_MESSAGES_PAGINATED_GET_INCLUDE_MESSAGES_FAILED",
            domain: ErrorDomain.STORAGE,
            category: ErrorCategory.THIRD_PARTY,
            details: { threadId }
          },
          error
        );
      }
    }
    try {
      const currentOffset = page * perPage;
      const conditions = [`thread_id = ?`];
      const queryParams = [threadId];
      if (fromDate) {
        conditions.push(`"createdAt" >= ?`);
        queryParams.push(fromDate.toISOString());
      }
      if (toDate) {
        conditions.push(`"createdAt" <= ?`);
        queryParams.push(toDate.toISOString());
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const countResult = await this.client.execute({
        sql: `SELECT COUNT(*) as count FROM ${TABLE_MESSAGES} ${whereClause}`,
        args: queryParams
      });
      const total = Number(countResult.rows?.[0]?.count ?? 0);
      if (total === 0 && messages.length === 0) {
        return {
          messages: [],
          total: 0,
          page,
          perPage,
          hasMore: false
        };
      }
      const excludeIds = messages.map((m) => m.id);
      const excludeIdsParam = excludeIds.map((_, idx) => `$${idx + queryParams.length + 1}`).join(", ");
      const dataResult = await this.client.execute({
        sql: `SELECT id, content, role, type, "createdAt", "resourceId", "thread_id" FROM ${TABLE_MESSAGES} ${whereClause} ${excludeIds.length ? `AND id NOT IN (${excludeIdsParam})` : ""} ORDER BY "createdAt" DESC LIMIT ? OFFSET ?`,
        args: [...queryParams, ...excludeIds, perPage, currentOffset]
      });
      messages.push(...(dataResult.rows || []).map((row) => this.parseRow(row)));
      const messagesToReturn = format === "v1" ? new MessageList().add(messages, "memory").get.all.v1() : new MessageList().add(messages, "memory").get.all.v2();
      return {
        messages: messagesToReturn,
        total,
        page,
        perPage,
        hasMore: currentOffset + messages.length < total
      };
    } catch (error) {
      const mastraError = new MastraError(
        {
          id: "LIBSQL_STORE_GET_MESSAGES_PAGINATED_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: { threadId }
        },
        error
      );
      this.logger?.trackException?.(mastraError);
      this.logger?.error?.(mastraError.toString());
      return { messages: [], total: 0, page, perPage, hasMore: false };
    }
  }
  async saveMessages({
    messages,
    format
  }) {
    if (messages.length === 0) return messages;
    try {
      const threadId = messages[0]?.threadId;
      if (!threadId) {
        throw new Error("Thread ID is required");
      }
      const batchStatements = messages.map((message) => {
        const time = message.createdAt || /* @__PURE__ */ new Date();
        if (!message.threadId) {
          throw new Error(
            `Expected to find a threadId for message, but couldn't find one. An unexpected error has occurred.`
          );
        }
        if (!message.resourceId) {
          throw new Error(
            `Expected to find a resourceId for message, but couldn't find one. An unexpected error has occurred.`
          );
        }
        return {
          sql: `INSERT INTO ${TABLE_MESSAGES} (id, thread_id, content, role, type, createdAt, resourceId) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  thread_id=excluded.thread_id,
                  content=excluded.content,
                  role=excluded.role,
                  type=excluded.type,
                  resourceId=excluded.resourceId
              `,
          args: [
            message.id,
            message.threadId,
            typeof message.content === "object" ? JSON.stringify(message.content) : message.content,
            message.role,
            message.type || "v2",
            time instanceof Date ? time.toISOString() : time,
            message.resourceId
          ]
        };
      });
      const now = (/* @__PURE__ */ new Date()).toISOString();
      batchStatements.push({
        sql: `UPDATE ${TABLE_THREADS} SET updatedAt = ? WHERE id = ?`,
        args: [now, threadId]
      });
      await this.client.batch(batchStatements, "write");
      const list = new MessageList().add(messages, "memory");
      if (format === `v2`) return list.get.all.v2();
      return list.get.all.v1();
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_SAVE_MESSAGES_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY
        },
        error
      );
    }
  }
  async updateMessages({
    messages
  }) {
    if (messages.length === 0) {
      return [];
    }
    const messageIds = messages.map((m) => m.id);
    const placeholders = messageIds.map(() => "?").join(",");
    const selectSql = `SELECT * FROM ${TABLE_MESSAGES} WHERE id IN (${placeholders})`;
    const existingResult = await this.client.execute({ sql: selectSql, args: messageIds });
    const existingMessages = existingResult.rows.map((row) => this.parseRow(row));
    if (existingMessages.length === 0) {
      return [];
    }
    const batchStatements = [];
    const threadIdsToUpdate = /* @__PURE__ */ new Set();
    const columnMapping = {
      threadId: "thread_id"
    };
    for (const existingMessage of existingMessages) {
      const updatePayload = messages.find((m) => m.id === existingMessage.id);
      if (!updatePayload) continue;
      const { id, ...fieldsToUpdate } = updatePayload;
      if (Object.keys(fieldsToUpdate).length === 0) continue;
      threadIdsToUpdate.add(existingMessage.threadId);
      if (updatePayload.threadId && updatePayload.threadId !== existingMessage.threadId) {
        threadIdsToUpdate.add(updatePayload.threadId);
      }
      const setClauses = [];
      const args = [];
      const updatableFields = { ...fieldsToUpdate };
      if (updatableFields.content) {
        const newContent = {
          ...existingMessage.content,
          ...updatableFields.content,
          // Deep merge metadata if it exists on both
          ...existingMessage.content?.metadata && updatableFields.content.metadata ? {
            metadata: {
              ...existingMessage.content.metadata,
              ...updatableFields.content.metadata
            }
          } : {}
        };
        setClauses.push(`${parseSqlIdentifier("content", "column name")} = ?`);
        args.push(JSON.stringify(newContent));
        delete updatableFields.content;
      }
      for (const key in updatableFields) {
        if (Object.prototype.hasOwnProperty.call(updatableFields, key)) {
          const dbKey = columnMapping[key] || key;
          setClauses.push(`${parseSqlIdentifier(dbKey, "column name")} = ?`);
          let value = updatableFields[key];
          if (typeof value === "object" && value !== null) {
            value = JSON.stringify(value);
          }
          args.push(value);
        }
      }
      if (setClauses.length === 0) continue;
      args.push(id);
      const sql = `UPDATE ${TABLE_MESSAGES} SET ${setClauses.join(", ")} WHERE id = ?`;
      batchStatements.push({ sql, args });
    }
    if (batchStatements.length === 0) {
      return existingMessages;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const threadId of threadIdsToUpdate) {
      if (threadId) {
        batchStatements.push({
          sql: `UPDATE ${TABLE_THREADS} SET updatedAt = ? WHERE id = ?`,
          args: [now, threadId]
        });
      }
    }
    await this.client.batch(batchStatements, "write");
    const updatedResult = await this.client.execute({ sql: selectSql, args: messageIds });
    return updatedResult.rows.map((row) => this.parseRow(row));
  }
  transformEvalRow(row) {
    const resultValue = JSON.parse(row.result);
    const testInfoValue = row.test_info ? JSON.parse(row.test_info) : void 0;
    if (!resultValue || typeof resultValue !== "object" || !("score" in resultValue)) {
      throw new Error(`Invalid MetricResult format: ${JSON.stringify(resultValue)}`);
    }
    return {
      input: row.input,
      output: row.output,
      result: resultValue,
      agentName: row.agent_name,
      metricName: row.metric_name,
      instructions: row.instructions,
      testInfo: testInfoValue,
      globalRunId: row.global_run_id,
      runId: row.run_id,
      createdAt: row.created_at
    };
  }
  /** @deprecated use getEvals instead */
  async getEvalsByAgentName(agentName, type) {
    try {
      const baseQuery = `SELECT * FROM ${TABLE_EVALS} WHERE agent_name = ?`;
      const typeCondition = type === "test" ? " AND test_info IS NOT NULL AND test_info->>'testPath' IS NOT NULL" : type === "live" ? " AND (test_info IS NULL OR test_info->>'testPath' IS NULL)" : "";
      const result = await this.client.execute({
        sql: `${baseQuery}${typeCondition} ORDER BY created_at DESC`,
        args: [agentName]
      });
      return result.rows?.map((row) => this.transformEvalRow(row)) ?? [];
    } catch (error) {
      if (error instanceof Error && error.message.includes("no such table")) {
        return [];
      }
      throw new MastraError(
        {
          id: "LIBSQL_STORE_GET_EVALS_BY_AGENT_NAME_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY,
          details: { agentName }
        },
        error
      );
    }
  }
  async getEvals(options = {}) {
    const { agentName, type, page = 0, perPage = 100, dateRange } = options;
    const fromDate = dateRange?.start;
    const toDate = dateRange?.end;
    const conditions = [];
    const queryParams = [];
    if (agentName) {
      conditions.push(`agent_name = ?`);
      queryParams.push(agentName);
    }
    if (type === "test") {
      conditions.push(`(test_info IS NOT NULL AND json_extract(test_info, '$.testPath') IS NOT NULL)`);
    } else if (type === "live") {
      conditions.push(`(test_info IS NULL OR json_extract(test_info, '$.testPath') IS NULL)`);
    }
    if (fromDate) {
      conditions.push(`created_at >= ?`);
      queryParams.push(fromDate.toISOString());
    }
    if (toDate) {
      conditions.push(`created_at <= ?`);
      queryParams.push(toDate.toISOString());
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    try {
      const countResult = await this.client.execute({
        sql: `SELECT COUNT(*) as count FROM ${TABLE_EVALS} ${whereClause}`,
        args: queryParams
      });
      const total = Number(countResult.rows?.[0]?.count ?? 0);
      const currentOffset = page * perPage;
      const hasMore = currentOffset + perPage < total;
      if (total === 0) {
        return {
          evals: [],
          total: 0,
          page,
          perPage,
          hasMore: false
        };
      }
      const dataResult = await this.client.execute({
        sql: `SELECT * FROM ${TABLE_EVALS} ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        args: [...queryParams, perPage, currentOffset]
      });
      return {
        evals: dataResult.rows?.map((row) => this.transformEvalRow(row)) ?? [],
        total,
        page,
        perPage,
        hasMore
      };
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_GET_EVALS_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY
        },
        error
      );
    }
  }
  /**
   * @deprecated use getTracesPaginated instead.
   */
  async getTraces(args) {
    if (args.fromDate || args.toDate) {
      args.dateRange = {
        start: args.fromDate,
        end: args.toDate
      };
    }
    try {
      const result = await this.getTracesPaginated(args);
      return result.traces;
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_GET_TRACES_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY
        },
        error
      );
    }
  }
  async getTracesPaginated(args) {
    const { name, scope, page = 0, perPage = 100, attributes, filters, dateRange } = args;
    const fromDate = dateRange?.start;
    const toDate = dateRange?.end;
    const currentOffset = page * perPage;
    const queryArgs = [];
    const conditions = [];
    if (name) {
      conditions.push("name LIKE ?");
      queryArgs.push(`${name}%`);
    }
    if (scope) {
      conditions.push("scope = ?");
      queryArgs.push(scope);
    }
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        conditions.push(`json_extract(attributes, '$.${key}') = ?`);
        queryArgs.push(value);
      });
    }
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        conditions.push(`${parseSqlIdentifier(key, "filter key")} = ?`);
        queryArgs.push(value);
      });
    }
    if (fromDate) {
      conditions.push("createdAt >= ?");
      queryArgs.push(fromDate.toISOString());
    }
    if (toDate) {
      conditions.push("createdAt <= ?");
      queryArgs.push(toDate.toISOString());
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    try {
      const countResult = await this.client.execute({
        sql: `SELECT COUNT(*) as count FROM ${TABLE_TRACES} ${whereClause}`,
        args: queryArgs
      });
      const total = Number(countResult.rows?.[0]?.count ?? 0);
      if (total === 0) {
        return {
          traces: [],
          total: 0,
          page,
          perPage,
          hasMore: false
        };
      }
      const dataResult = await this.client.execute({
        sql: `SELECT * FROM ${TABLE_TRACES} ${whereClause} ORDER BY "startTime" DESC LIMIT ? OFFSET ?`,
        args: [...queryArgs, perPage, currentOffset]
      });
      const traces = dataResult.rows?.map(
        (row) => ({
          id: row.id,
          parentSpanId: row.parentSpanId,
          traceId: row.traceId,
          name: row.name,
          scope: row.scope,
          kind: row.kind,
          status: safelyParseJSON(row.status),
          events: safelyParseJSON(row.events),
          links: safelyParseJSON(row.links),
          attributes: safelyParseJSON(row.attributes),
          startTime: row.startTime,
          endTime: row.endTime,
          other: safelyParseJSON(row.other),
          createdAt: row.createdAt
        })
      ) ?? [];
      return {
        traces,
        total,
        page,
        perPage,
        hasMore: currentOffset + traces.length < total
      };
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_GET_TRACES_PAGINATED_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY
        },
        error
      );
    }
  }
  async getWorkflowRuns({
    workflowName,
    fromDate,
    toDate,
    limit,
    offset,
    resourceId
  } = {}) {
    try {
      const conditions = [];
      const args = [];
      if (workflowName) {
        conditions.push("workflow_name = ?");
        args.push(workflowName);
      }
      if (fromDate) {
        conditions.push("createdAt >= ?");
        args.push(fromDate.toISOString());
      }
      if (toDate) {
        conditions.push("createdAt <= ?");
        args.push(toDate.toISOString());
      }
      if (resourceId) {
        const hasResourceId = await this.hasColumn(TABLE_WORKFLOW_SNAPSHOT, "resourceId");
        if (hasResourceId) {
          conditions.push("resourceId = ?");
          args.push(resourceId);
        } else {
          console.warn(`[${TABLE_WORKFLOW_SNAPSHOT}] resourceId column not found. Skipping resourceId filter.`);
        }
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      let total = 0;
      if (limit !== void 0 && offset !== void 0) {
        const countResult = await this.client.execute({
          sql: `SELECT COUNT(*) as count FROM ${TABLE_WORKFLOW_SNAPSHOT} ${whereClause}`,
          args
        });
        total = Number(countResult.rows?.[0]?.count ?? 0);
      }
      const result = await this.client.execute({
        sql: `SELECT * FROM ${TABLE_WORKFLOW_SNAPSHOT} ${whereClause} ORDER BY createdAt DESC${limit !== void 0 && offset !== void 0 ? ` LIMIT ? OFFSET ?` : ""}`,
        args: limit !== void 0 && offset !== void 0 ? [...args, limit, offset] : args
      });
      const runs = (result.rows || []).map((row) => this.parseWorkflowRun(row));
      return { runs, total: total || runs.length };
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_GET_WORKFLOW_RUNS_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY
        },
        error
      );
    }
  }
  async getWorkflowRunById({
    runId,
    workflowName
  }) {
    const conditions = [];
    const args = [];
    if (runId) {
      conditions.push("run_id = ?");
      args.push(runId);
    }
    if (workflowName) {
      conditions.push("workflow_name = ?");
      args.push(workflowName);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    try {
      const result = await this.client.execute({
        sql: `SELECT * FROM ${TABLE_WORKFLOW_SNAPSHOT} ${whereClause}`,
        args
      });
      if (!result.rows?.[0]) {
        return null;
      }
      return this.parseWorkflowRun(result.rows[0]);
    } catch (error) {
      throw new MastraError(
        {
          id: "LIBSQL_STORE_GET_WORKFLOW_RUN_BY_ID_FAILED",
          domain: ErrorDomain.STORAGE,
          category: ErrorCategory.THIRD_PARTY
        },
        error
      );
    }
  }
  async getResourceById({ resourceId }) {
    const result = await this.load({
      tableName: TABLE_RESOURCES,
      keys: { id: resourceId }
    });
    if (!result) {
      return null;
    }
    return {
      ...result,
      // Ensure workingMemory is always returned as a string, even if auto-parsed as JSON
      workingMemory: typeof result.workingMemory === "object" ? JSON.stringify(result.workingMemory) : result.workingMemory,
      metadata: typeof result.metadata === "string" ? JSON.parse(result.metadata) : result.metadata
    };
  }
  async saveResource({ resource }) {
    await this.insert({
      tableName: TABLE_RESOURCES,
      record: {
        ...resource,
        metadata: JSON.stringify(resource.metadata)
      }
    });
    return resource;
  }
  async updateResource({
    resourceId,
    workingMemory,
    metadata
  }) {
    const existingResource = await this.getResourceById({ resourceId });
    if (!existingResource) {
      const newResource = {
        id: resourceId,
        workingMemory,
        metadata: metadata || {},
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      return this.saveResource({ resource: newResource });
    }
    const updatedResource = {
      ...existingResource,
      workingMemory: workingMemory !== void 0 ? workingMemory : existingResource.workingMemory,
      metadata: {
        ...existingResource.metadata,
        ...metadata
      },
      updatedAt: /* @__PURE__ */ new Date()
    };
    const updates = [];
    const values = [];
    if (workingMemory !== void 0) {
      updates.push("workingMemory = ?");
      values.push(workingMemory);
    }
    if (metadata) {
      updates.push("metadata = ?");
      values.push(JSON.stringify(updatedResource.metadata));
    }
    updates.push("updatedAt = ?");
    values.push(updatedResource.updatedAt.toISOString());
    values.push(resourceId);
    await this.client.execute({
      sql: `UPDATE ${TABLE_RESOURCES} SET ${updates.join(", ")} WHERE id = ?`,
      args: values
    });
    return updatedResource;
  }
  async hasColumn(table, column) {
    const result = await this.client.execute({
      sql: `PRAGMA table_info(${table})`
    });
    return (await result.rows)?.some((row) => row.name === column);
  }
  parseWorkflowRun(row) {
    let parsedSnapshot = row.snapshot;
    if (typeof parsedSnapshot === "string") {
      try {
        parsedSnapshot = JSON.parse(row.snapshot);
      } catch (e) {
        console.warn(`Failed to parse snapshot for workflow ${row.workflow_name}: ${e}`);
      }
    }
    return {
      workflowName: row.workflow_name,
      runId: row.run_id,
      snapshot: parsedSnapshot,
      resourceId: row.resourceId,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
};

export { LibSQLStore };
