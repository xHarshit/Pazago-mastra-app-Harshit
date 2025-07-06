import fs from 'fs';
import path from 'path';
import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PgVector } from '@mastra/pg';
import 'dotenv/config';

// Configuration
const CONFIG = {
  parsedDataFolder: path.join(__dirname, '../documents/parseData'),
  outputFolder: path.join(__dirname, '../documents/processed'),
  vectorIndexName: 'berkshire_embeddings',
  chunkStrategy: 'recursive' as const,
  chunkSize: 512,
  chunkOverlap: 50,
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536, // Default for text-embedding-3-small
  batchSize: 100, // Process embeddings in batches
};

interface ProcessedChunk {
  id: string;
  text: string;
  metadata: {
    filename: string;
    documentTitle?: string;
    chunkIndex: number;
    totalChunks: number;
    wordCount: number;
    characterCount: number;
    sourceType: 'berkshire_letter';
    year?: string;
    [key: string]: any;
  };
  embedding?: number[];
}

interface ProcessingResult {
  totalDocuments: number;
  totalChunks: number;
  totalEmbeddings: number;
  processedFiles: string[];
  errors: string[];
  processingTime: number;
}

class MastraDataIngestion {
  private pgVector: PgVector;
  private processedChunks: ProcessedChunk[] = [];

  constructor() {
    // Initialize PgVector connection - corrected constructor
    const connectionString = process.env.POSTGRES_CONNECTION_STRING || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_CONNECTION_STRING or DATABASE_URL environment variable is required');
    }
    this.pgVector = new PgVector({
      connectionString,
      schemaName: 'public' // Optional schema name
    });
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  }

  private extractYearFromFilename(filename: string): string | undefined {
    // Extract year from filename (e.g., "2023_letter" -> "2023")
    const yearMatch = filename.match(/(\d{4})/);
    return yearMatch ? yearMatch[1] : undefined;
  }

  private generateChunkId(filename: string, chunkIndex: number): string {
    return `${filename}_chunk_${chunkIndex}`;
  }

  private async processDocument(filePath: string): Promise<ProcessedChunk[]> {
    try {
      console.log(`📖 Processing document: ${path.basename(filePath)}`);
      
      // Read the parsed document
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath, '.txt');
      
      // Extract document title and metadata from header
      const headerMatch = content.match(/DOCUMENT: (.+)\n/);
      const documentTitle = headerMatch ? headerMatch[1] : filename;
      
      // Extract content after the separator
      const contentMatch = content.match(/CONTENT:\n={80}\n\n([\s\S]*)/);
      const documentContent = contentMatch ? contentMatch[1] : content;
      
      if (!documentContent.trim()) {
        throw new Error(`No content found in document: ${filename}`);
      }

      // Create MDocument instance
      const doc = MDocument.fromText(documentContent);
      
      // Create chunks using Mastra's chunking strategy
      const chunks = await doc.chunk({
        strategy: CONFIG.chunkStrategy,
        size: CONFIG.chunkSize,
        overlap: CONFIG.chunkOverlap,
        separator: '\n',
        extract: {
          // No additional extract options needed
        },
      });

      console.log(`  ✓ Created ${chunks.length} chunks from ${filename}`);

      // Process chunks into our format
      const processedChunks: ProcessedChunk[] = chunks.map((chunk, index) => {
        const chunkText = chunk.text.trim();
        const wordCount = chunkText.split(/\s+/).filter(word => word.length > 0).length;
        
        return {
          id: this.generateChunkId(filename, index),
          text: chunkText,
          metadata: {
            filename,
            documentTitle,
            chunkIndex: index,
            totalChunks: chunks.length,
            wordCount,
            characterCount: chunkText.length,
            sourceType: 'berkshire_letter',
            year: this.extractYearFromFilename(filename),
            originalPath: filePath,
            ...chunk.metadata, // Include any metadata from Mastra chunking
          },
        };
      });

      return processedChunks;
    } catch (error) {
      throw new Error(`Failed to process document ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateEmbeddings(chunks: ProcessedChunk[]): Promise<ProcessedChunk[]> {
    console.log(`🔄 Generating embeddings for ${chunks.length} chunks...`);
    
    const chunksWithEmbeddings: ProcessedChunk[] = [];
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < chunks.length; i += CONFIG.batchSize) {
      const batch = chunks.slice(i, i + CONFIG.batchSize);
      console.log(`  Processing batch ${Math.floor(i / CONFIG.batchSize) + 1}/${Math.ceil(chunks.length / CONFIG.batchSize)}`);
      
      try {
        // Generate embeddings using Mastra's AI SDK integration
        const { embeddings } = await embedMany({
          model: openai.embedding(CONFIG.embeddingModel),
          values: batch.map(chunk => chunk.text),
        });

        // Attach embeddings to chunks
        batch.forEach((chunk, index) => {
          chunksWithEmbeddings.push({
            ...chunk,
            embedding: embeddings[index],
          });
        });

        console.log(`  ✓ Generated embeddings for batch (${batch.length} chunks)`);
        
        // Add a small delay to respect rate limits
        if (i + CONFIG.batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        throw new Error(`Failed to generate embeddings for batch starting at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return chunksWithEmbeddings;
  }

  private async storeInVectorDatabase(chunks: ProcessedChunk[]): Promise<void> {
    console.log(`💾 Storing ${chunks.length} embeddings in vector database...`);
    
    try {
      // First, ensure the index exists
      await this.pgVector.createIndex({
        indexName: CONFIG.vectorIndexName,
        dimension: CONFIG.embeddingDimensions,
        metric: 'cosine',
      });

      // Prepare data for upsert - corrected format
      const vectors = chunks.map(chunk => chunk.embedding!);
      const metadata = chunks.map(chunk => chunk.metadata);
      const ids = chunks.map(chunk => chunk.id);

      // Store in PgVector using corrected upsert format
      await this.pgVector.upsert({
        indexName: CONFIG.vectorIndexName,
        vectors: vectors,
        metadata: metadata,
        ids: ids,
      });

      console.log(`  ✓ Successfully stored ${vectors.length} vectors in index: ${CONFIG.vectorIndexName}`);
    } catch (error) {
      throw new Error(`Failed to store embeddings in vector database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private saveProcessingResults(chunks: ProcessedChunk[]): void {
    this.ensureDirectoryExists(CONFIG.outputFolder);
    
    // Save chunks metadata
    const chunksMetadata = chunks.map(chunk => ({
      id: chunk.id,
      text: chunk.text.substring(0, 200) + '...', // Truncate for readability
      metadata: chunk.metadata,
      embeddingDimensions: chunk.embedding?.length || 0,
    }));

    const metadataPath = path.join(CONFIG.outputFolder, 'chunks_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(chunksMetadata, null, 2));
    console.log(`📊 Saved chunks metadata: ${metadataPath}`);

    // Save full chunks (without embeddings to save space)
    const chunksData = chunks.map(chunk => ({
      id: chunk.id,
      text: chunk.text,
      metadata: chunk.metadata,
    }));

    const chunksPath = path.join(CONFIG.outputFolder, 'processed_chunks.json');
    fs.writeFileSync(chunksPath, JSON.stringify(chunksData, null, 2));
    console.log(`📄 Saved processed chunks: ${chunksPath}`);
  }

  private generateProcessingReport(result: ProcessingResult): void {
    const reportPath = path.join(CONFIG.outputFolder, 'processing_report.txt');
    
    const report = [
      '='.repeat(80),
      'MASTRA DATA INGESTION REPORT',
      '='.repeat(80),
      `Generated: ${new Date().toISOString()}`,
      `Processing Time: ${result.processingTime.toFixed(2)} seconds`,
      '',
      'PROCESSING SUMMARY:',
      `-`.repeat(40),
      `Total Documents Processed: ${result.totalDocuments}`,
      `Total Chunks Created: ${result.totalChunks}`,
      `Total Embeddings Generated: ${result.totalEmbeddings}`,
      `Vector Index Name: ${CONFIG.vectorIndexName}`,
      '',
      'CONFIGURATION:',
      `-`.repeat(40),
      `Chunk Strategy: ${CONFIG.chunkStrategy}`,
      `Chunk Size: ${CONFIG.chunkSize}`,
      `Chunk Overlap: ${CONFIG.chunkOverlap}`,
      `Embedding Model: ${CONFIG.embeddingModel}`,
      `Embedding Dimensions: ${CONFIG.embeddingDimensions}`,
      `Batch Size: ${CONFIG.batchSize}`,
      '',
      'PROCESSED FILES:',
      `-`.repeat(40),
      ...result.processedFiles.map(file => `✓ ${file}`),
      '',
    ];

    if (result.errors.length > 0) {
      report.push(
        'ERRORS:',
        `-`.repeat(40),
        ...result.errors.map(error => `❌ ${error}`),
        ''
      );
    }

    report.push(
      'NEXT STEPS:',
      `-`.repeat(40),
      `1. Vector embeddings are stored in PostgreSQL index: ${CONFIG.vectorIndexName}`,
      `2. Chunks metadata saved to: ${CONFIG.outputFolder}/chunks_metadata.json`,
      `3. Ready for RAG agent implementation (Task 3.1)`,
      `4. Test queries using Mastra's vector search capabilities`,
      '='.repeat(80)
    );

    fs.writeFileSync(reportPath, report.join('\n'));
    console.log(`📊 Processing report saved: ${reportPath}`);
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    console.log('🚀 Starting Mastra Data Ingestion Process...');
    console.log(`📂 Source folder: ${CONFIG.parsedDataFolder}`);
    console.log(`📂 Output folder: ${CONFIG.outputFolder}`);
    
    try {
      // Validate environment and folders
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }

      if (!fs.existsSync(CONFIG.parsedDataFolder)) {
        throw new Error(`Parsed data folder does not exist: ${CONFIG.parsedDataFolder}`);
      }

      // Get all parsed text files
      const allFiles = fs.readdirSync(CONFIG.parsedDataFolder);
      const textFiles = allFiles.filter(file => 
        file.endsWith('.txt') && !file.startsWith('_') // Exclude summary files
      );

      if (textFiles.length === 0) {
        throw new Error('No parsed text files found in the input folder');
      }

      console.log(`📄 Found ${textFiles.length} parsed document(s) to process`);

      const processedFiles: string[] = [];
      const errors: string[] = [];
      let allChunks: ProcessedChunk[] = [];

      // Process each document
      for (let i = 0; i < textFiles.length; i++) {
        const file = textFiles[i];
        const filePath = path.join(CONFIG.parsedDataFolder, file);
        
        console.log(`\n📖 Processing document [${i + 1}/${textFiles.length}]: ${file}`);

        try {
          const chunks = await this.processDocument(filePath);
          allChunks = allChunks.concat(chunks);
          processedFiles.push(file);
          console.log(`  ✓ Successfully processed: ${file} (${chunks.length} chunks)`);
        } catch (error) {
          const errorMessage = `Failed to process ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`  ❌ ${errorMessage}`);
          errors.push(errorMessage);
        }
      }

      if (allChunks.length === 0) {
        throw new Error('No chunks were successfully created from any document');
      }

      console.log(`\n📊 Total chunks created: ${allChunks.length}`);

      // Generate embeddings
      const chunksWithEmbeddings = await this.generateEmbeddings(allChunks);
      console.log(`✓ Generated ${chunksWithEmbeddings.length} embeddings`);

      // Store in vector database
      await this.storeInVectorDatabase(chunksWithEmbeddings);

      // Save processing results
      this.saveProcessingResults(chunksWithEmbeddings);

      // Generate final report
      const processingTime = (Date.now() - startTime) / 1000;
      const result: ProcessingResult = {
        totalDocuments: processedFiles.length,
        totalChunks: allChunks.length,
        totalEmbeddings: chunksWithEmbeddings.length,
        processedFiles,
        errors,
        processingTime,
      };

      this.generateProcessingReport(result);

      // Final summary
      console.log('\n' + '='.repeat(80));
      console.log('🎉 DATA INGESTION COMPLETE');
      console.log('='.repeat(80));
      console.log(`✅ Successfully processed: ${result.totalDocuments} documents`);
      console.log(`✅ Created chunks: ${result.totalChunks}`);
      console.log(`✅ Generated embeddings: ${result.totalEmbeddings}`);
      console.log(`✅ Stored in vector index: ${CONFIG.vectorIndexName}`);
      console.log(`⏱️  Processing time: ${result.processingTime.toFixed(2)} seconds`);
      
      if (errors.length > 0) {
        console.log(`⚠️  Errors encountered: ${errors.length}`);
        console.log('Check the processing report for details');
      }
      
      console.log('\n🔄 Next Steps:');
      console.log('1. Proceed to Task 3.1: Create RAG Agent');
      console.log('2. Test vector search functionality');
      console.log('3. Implement conversation memory');
      console.log('='.repeat(80));
      
    } catch (error) {
      console.error('\n❌ Fatal error during data ingestion:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    } finally {
      // Clean up database connection
      await this.pgVector.disconnect();
    }
  }
}

// Execute the ingestion process
const ingestion = new MastraDataIngestion();
ingestion.run().catch(console.error);