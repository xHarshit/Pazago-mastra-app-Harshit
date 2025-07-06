import { c as convertToCoreMessages, i as isUiMessage, a as isCoreMessage } from './utils.mjs';
import { M as MastraError } from './chunk-6UNGH46J.mjs';
import { randomUUID } from 'crypto';
import { e as convertUint8ArrayToBase64, b as convertBase64ToUint8Array } from './index.mjs';
import { u as unionType, s as stringType, i as instanceOfType, f as custom } from './types.mjs';

unionType([
  stringType(),
  instanceOfType(Uint8Array),
  instanceOfType(ArrayBuffer),
  custom(
    // Buffer might not be available in some environments such as CloudFlare:
    (value) => globalThis.Buffer?.isBuffer(value) ?? false,
    { message: "Must be a Buffer" }
  )
]);
function convertDataContentToBase64String(content) {
  if (typeof content === "string") {
    return content;
  }
  if (content instanceof ArrayBuffer) {
    return convertUint8ArrayToBase64(new Uint8Array(content));
  }
  return convertUint8ArrayToBase64(content);
}
function convertDataContentToUint8Array(content) {
  if (content instanceof Uint8Array) {
    return content;
  }
  if (typeof content === "string") {
    try {
      return convertBase64ToUint8Array(content);
    } catch (error) {
      throw new Error("Invalid data content. Content string is not a base64-encoded media.", {
        cause: error
      });
    }
  }
  if (content instanceof ArrayBuffer) {
    return new Uint8Array(content);
  }
  throw new Error(content);
}
function convertUint8ArrayToText(uint8Array) {
  try {
    return new TextDecoder().decode(uint8Array);
  } catch {
    throw new Error("Error decoding Uint8Array to text");
  }
}

// src/agent/message-list/prompt/attachments-to-parts.ts
function attachmentsToParts(attachments) {
  const parts = [];
  for (const attachment of attachments) {
    let url;
    try {
      url = new URL(attachment.url);
    } catch {
      throw new Error(`Invalid URL: ${attachment.url}`);
    }
    switch (url.protocol) {
      case "http:":
      case "https:": {
        if (attachment.contentType?.startsWith("image/")) {
          parts.push({ type: "image", image: url.toString(), mimeType: attachment.contentType });
        } else {
          if (!attachment.contentType) {
            throw new Error("If the attachment is not an image, it must specify a content type");
          }
          parts.push({
            type: "file",
            data: url.toString(),
            mimeType: attachment.contentType
          });
        }
        break;
      }
      case "data:": {
        let header;
        let base64Content;
        let mimeType;
        try {
          [header, base64Content] = attachment.url.split(",");
          mimeType = header?.split?.(";")?.[0]?.split(":")[1];
        } catch {
          throw new Error(`Error processing data URL: ${attachment.url}`);
        }
        if (mimeType == null || base64Content == null) {
          throw new Error(`Invalid data URL format: ${attachment.url}`);
        }
        if (attachment.contentType?.startsWith("image/")) {
          parts.push({
            type: "image",
            image: attachment.url,
            mimeType: attachment.contentType
          });
        } else if (attachment.contentType?.startsWith("text/")) {
          parts.push({
            type: "text",
            text: convertUint8ArrayToText(convertDataContentToUint8Array(base64Content))
          });
        } else {
          if (!attachment.contentType) {
            throw new Error("If the attachment is not an image or text, it must specify a content type");
          }
          parts.push({
            type: "file",
            data: base64Content,
            mimeType: attachment.contentType
          });
        }
        break;
      }
      default: {
        throw new Error(`Unsupported URL protocol: ${url.protocol}`);
      }
    }
  }
  return parts;
}

// src/agent/message-list/prompt/convert-to-mastra-v1.ts
var makePushOrCombine = (v1Messages) => (msg) => {
  const previousMessage = v1Messages.at(-1);
  if (msg.role === previousMessage?.role && Array.isArray(previousMessage.content) && Array.isArray(msg.content) && // we were creating new messages for tool calls before and not appending to the assistant message
  // so don't append here so everything works as before
  (msg.role !== `assistant` || msg.role === `assistant` && msg.content.at(-1)?.type !== `tool-call`)) {
    for (const part of msg.content) {
      previousMessage.content.push(part);
    }
  } else {
    v1Messages.push(msg);
  }
};
function convertToV1Messages(messages) {
  const v1Messages = [];
  const pushOrCombine = makePushOrCombine(v1Messages);
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const isLastMessage = i === messages.length - 1;
    if (!message?.content) continue;
    const { content, experimental_attachments: inputAttachments = [], parts: inputParts } = message.content;
    const { role } = message;
    const fields = {
      id: message.id,
      createdAt: message.createdAt,
      resourceId: message.resourceId,
      threadId: message.threadId
    };
    const experimental_attachments = [...inputAttachments];
    const parts = [];
    for (const part of inputParts) {
      if (part.type === "file") {
        experimental_attachments.push({
          url: part.data,
          contentType: part.mimeType
        });
      } else {
        parts.push(part);
      }
    }
    switch (role) {
      case "user": {
        if (parts == null) {
          const userContent = experimental_attachments ? [{ type: "text", text: content || "" }, ...attachmentsToParts(experimental_attachments)] : { type: "text", text: content || "" };
          pushOrCombine({
            role: "user",
            ...fields,
            type: "text",
            // @ts-ignore
            content: userContent
          });
        } else {
          const textParts = message.content.parts.filter((part) => part.type === "text").map((part) => ({
            type: "text",
            text: part.text
          }));
          const userContent = experimental_attachments ? [...textParts, ...attachmentsToParts(experimental_attachments)] : textParts;
          pushOrCombine({
            role: "user",
            ...fields,
            type: "text",
            content: Array.isArray(userContent) && userContent.length === 1 && userContent[0]?.type === `text` && typeof content !== `undefined` ? content : userContent
          });
        }
        break;
      }
      case "assistant": {
        if (message.content.parts != null) {
          let processBlock2 = function() {
            const content2 = [];
            for (const part of block) {
              switch (part.type) {
                case "file":
                case "text": {
                  content2.push(part);
                  break;
                }
                case "reasoning": {
                  for (const detail of part.details) {
                    switch (detail.type) {
                      case "text":
                        content2.push({
                          type: "reasoning",
                          text: detail.text,
                          signature: detail.signature
                        });
                        break;
                      case "redacted":
                        content2.push({
                          type: "redacted-reasoning",
                          data: detail.data
                        });
                        break;
                    }
                  }
                  break;
                }
                case "tool-invocation":
                  content2.push({
                    type: "tool-call",
                    toolCallId: part.toolInvocation.toolCallId,
                    toolName: part.toolInvocation.toolName,
                    args: part.toolInvocation.args
                  });
                  break;
              }
            }
            pushOrCombine({
              role: "assistant",
              ...fields,
              type: content2.some((c) => c.type === `tool-call`) ? "tool-call" : "text",
              // content: content,
              content: typeof content2 !== `string` && Array.isArray(content2) && content2.length === 1 && content2[0]?.type === `text` ? message?.content?.content || content2 : content2
            });
            const stepInvocations = block.filter((part) => `type` in part && part.type === "tool-invocation").map((part) => part.toolInvocation);
            if (stepInvocations.length > 0) {
              pushOrCombine({
                role: "tool",
                ...fields,
                type: "tool-result",
                // @ts-ignore
                content: stepInvocations.map((toolInvocation) => {
                  const { toolCallId, toolName } = toolInvocation;
                  return {
                    type: "tool-result",
                    toolCallId,
                    toolName,
                    // @ts-ignore
                    result: toolInvocation.result
                  };
                })
              });
            }
            block = [];
            blockHasToolInvocations = false;
            currentStep++;
          };
          let currentStep = 0;
          let blockHasToolInvocations = false;
          let block = [];
          for (const part of message.content.parts) {
            switch (part.type) {
              case "text": {
                if (blockHasToolInvocations) {
                  processBlock2();
                }
                block.push(part);
                break;
              }
              case "file":
              case "reasoning": {
                block.push(part);
                break;
              }
              case "tool-invocation": {
                if ((part.toolInvocation.step ?? 0) !== currentStep) {
                  processBlock2();
                }
                block.push(part);
                blockHasToolInvocations = true;
                break;
              }
            }
          }
          processBlock2();
          break;
        }
        const toolInvocations = message.content.toolInvocations;
        if (toolInvocations == null || toolInvocations.length === 0) {
          pushOrCombine({ role: "assistant", ...fields, content: content || "", type: "text" });
          break;
        }
        const maxStep = toolInvocations.reduce((max, toolInvocation) => {
          return Math.max(max, toolInvocation.step ?? 0);
        }, 0);
        for (let i2 = 0; i2 <= maxStep; i2++) {
          const stepInvocations = toolInvocations.filter((toolInvocation) => (toolInvocation.step ?? 0) === i2);
          if (stepInvocations.length === 0) {
            continue;
          }
          pushOrCombine({
            role: "assistant",
            ...fields,
            type: "tool-call",
            content: [
              ...isLastMessage && content && i2 === 0 ? [{ type: "text", text: content }] : [],
              ...stepInvocations.map(({ toolCallId, toolName, args }) => ({
                type: "tool-call",
                toolCallId,
                toolName,
                args
              }))
            ]
          });
          pushOrCombine({
            role: "tool",
            ...fields,
            type: "tool-result",
            content: stepInvocations.map((toolInvocation) => {
              if (!("result" in toolInvocation)) {
                return toolInvocation;
              }
              const { toolCallId, toolName, result } = toolInvocation;
              return {
                type: "tool-result",
                toolCallId,
                toolName,
                result
              };
            })
          });
        }
        if (content && !isLastMessage) {
          pushOrCombine({ role: "assistant", ...fields, type: "text", content: content || "" });
        }
        break;
      }
    }
  }
  return v1Messages;
}

// src/agent/message-list/index.ts
function isToolCallMessage(message) {
  if (message.role === "tool") {
    return true;
  }
  if (message.role === "assistant" && Array.isArray(message.content)) {
    return message.content.some((part) => part.type === "tool-call");
  }
  return false;
}
var MessageList = class _MessageList {
  messages = [];
  // passed in by dev in input or context
  systemMessages = [];
  // passed in by us for a specific purpose, eg memory system message
  taggedSystemMessages = {};
  memoryInfo = null;
  // used to filter this.messages by how it was added: input/response/memory
  memoryMessages = /* @__PURE__ */ new Set();
  newUserMessages = /* @__PURE__ */ new Set();
  newResponseMessages = /* @__PURE__ */ new Set();
  userContextMessages = /* @__PURE__ */ new Set();
  generateMessageId;
  constructor({
    threadId,
    resourceId,
    generateMessageId
  } = {}) {
    if (threadId) {
      this.memoryInfo = { threadId, resourceId };
      this.generateMessageId = generateMessageId;
    }
  }
  add(messages, messageSource) {
    if (!messages) return this;
    for (const message of Array.isArray(messages) ? messages : [messages]) {
      this.addOne(
        typeof message === `string` ? {
          role: "user",
          content: message
        } : message,
        messageSource
      );
    }
    return this;
  }
  getLatestUserContent() {
    const currentUserMessages = this.all.core().filter((m) => m.role === "user");
    const content = currentUserMessages.at(-1)?.content;
    if (!content) return null;
    return _MessageList.coreContentToString(content);
  }
  get get() {
    return {
      all: this.all,
      remembered: this.remembered,
      input: this.input,
      response: this.response
    };
  }
  all = {
    v2: () => this.messages,
    v1: () => convertToV1Messages(this.messages),
    ui: () => this.messages.map(_MessageList.toUIMessage),
    core: () => this.convertToCoreMessages(this.all.ui()),
    prompt: () => {
      const coreMessages = this.all.core();
      while (coreMessages[0] && isToolCallMessage(coreMessages[0])) {
        coreMessages.shift();
      }
      const messages = [...this.systemMessages, ...Object.values(this.taggedSystemMessages).flat(), ...coreMessages];
      return messages;
    }
  };
  remembered = {
    v2: () => this.messages.filter((m) => this.memoryMessages.has(m)),
    v1: () => convertToV1Messages(this.remembered.v2()),
    ui: () => this.remembered.v2().map(_MessageList.toUIMessage),
    core: () => this.convertToCoreMessages(this.remembered.ui())
  };
  input = {
    v2: () => this.messages.filter((m) => this.newUserMessages.has(m)),
    v1: () => convertToV1Messages(this.input.v2()),
    ui: () => this.input.v2().map(_MessageList.toUIMessage),
    core: () => this.convertToCoreMessages(this.input.ui())
  };
  response = {
    v2: () => this.messages.filter((m) => this.newResponseMessages.has(m))
  };
  drainUnsavedMessages() {
    const messages = this.messages.filter((m) => this.newUserMessages.has(m) || this.newResponseMessages.has(m));
    this.newUserMessages.clear();
    this.newResponseMessages.clear();
    return messages;
  }
  getSystemMessages(tag) {
    if (tag) {
      return this.taggedSystemMessages[tag] || [];
    }
    return this.systemMessages;
  }
  addSystem(messages, tag) {
    if (!messages) return this;
    for (const message of Array.isArray(messages) ? messages : [messages]) {
      this.addOneSystem(message, tag);
    }
    return this;
  }
  convertToCoreMessages(messages) {
    return convertToCoreMessages(this.sanitizeUIMessages(messages));
  }
  sanitizeUIMessages(messages) {
    const msgs = messages.map((m) => {
      if (m.parts.length === 0) return false;
      const safeParts = m.parts.filter(
        (p) => p.type !== `tool-invocation` || // calls and partial-calls should be updated to be results at this point
        // if they haven't we can't send them back to the llm and need to remove them.
        p.toolInvocation.state !== `call` && p.toolInvocation.state !== `partial-call`
      );
      if (!safeParts.length) return false;
      const sanitized = {
        ...m,
        parts: safeParts
      };
      if (`toolInvocations` in m && m.toolInvocations) {
        sanitized.toolInvocations = m.toolInvocations.filter((t) => t.state === `result`);
      }
      return sanitized;
    }).filter((m) => Boolean(m));
    return msgs;
  }
  addOneSystem(message, tag) {
    if (typeof message === `string`) message = { role: "system", content: message };
    if (tag && !this.isDuplicateSystem(message, tag)) {
      this.taggedSystemMessages[tag] ||= [];
      this.taggedSystemMessages[tag].push(message);
    } else if (!this.isDuplicateSystem(message)) {
      this.systemMessages.push(message);
    }
  }
  isDuplicateSystem(message, tag) {
    if (tag) {
      if (!this.taggedSystemMessages[tag]) return false;
      return this.taggedSystemMessages[tag].some(
        (m) => _MessageList.cacheKeyFromContent(m.content) === _MessageList.cacheKeyFromContent(message.content)
      );
    }
    return this.systemMessages.some(
      (m) => _MessageList.cacheKeyFromContent(m.content) === _MessageList.cacheKeyFromContent(message.content)
    );
  }
  static toUIMessage(m) {
    const experimentalAttachments = m.content.experimental_attachments ? [...m.content.experimental_attachments] : [];
    const contentString = typeof m.content.content === `string` && m.content.content !== "" ? m.content.content : m.content.parts.reduce((prev, part) => {
      if (part.type === `text`) {
        return part.text;
      }
      return prev;
    }, "");
    const parts = [];
    if (m.content.parts.length) {
      for (const part of m.content.parts) {
        if (part.type === `file`) {
          experimentalAttachments.push({
            contentType: part.mimeType,
            url: part.data
          });
        } else if (part.type === "tool-invocation" && (part.toolInvocation.state === "call" || part.toolInvocation.state === "partial-call")) {
          continue;
        } else {
          parts.push(part);
        }
      }
    }
    if (parts.length === 0 && experimentalAttachments.length > 0) {
      parts.push({ type: "text", text: "" });
    }
    if (m.role === `user`) {
      return {
        id: m.id,
        role: m.role,
        content: m.content.content || contentString,
        createdAt: m.createdAt,
        parts,
        experimental_attachments: experimentalAttachments
      };
    } else if (m.role === `assistant`) {
      return {
        id: m.id,
        role: m.role,
        content: m.content.content || contentString,
        createdAt: m.createdAt,
        parts,
        reasoning: void 0,
        toolInvocations: `toolInvocations` in m.content ? m.content.toolInvocations?.filter((t) => t.state === "result") : void 0
      };
    }
    return {
      id: m.id,
      role: m.role,
      content: m.content.content || contentString,
      createdAt: m.createdAt,
      parts,
      experimental_attachments: experimentalAttachments
    };
  }
  getMessageById(id) {
    return this.messages.find((m) => m.id === id);
  }
  shouldReplaceMessage(message) {
    if (!this.messages.length) return { exists: false };
    if (!(`id` in message) || !message?.id) {
      return { exists: false };
    }
    const existingMessage = this.getMessageById(message.id);
    if (!existingMessage) return { exists: false };
    return {
      exists: true,
      shouldReplace: !_MessageList.messagesAreEqual(existingMessage, message),
      id: existingMessage.id
    };
  }
  addOne(message, messageSource) {
    if ((!(`content` in message) || !message.content && // allow empty strings
    typeof message.content !== "string") && (!(`parts` in message) || !message.parts)) {
      throw new MastraError({
        id: "INVALID_MESSAGE_CONTENT",
        domain: "AGENT" /* AGENT */,
        category: "USER" /* USER */,
        text: `Message with role "${message.role}" must have either a 'content' property (string or array) or a 'parts' property (array) that is not empty, null, or undefined. Received message: ${JSON.stringify(message, null, 2)}`,
        details: {
          role: message.role,
          messageSource,
          hasContent: "content" in message,
          hasParts: "parts" in message
        }
      });
    }
    if (message.role === `system` && _MessageList.isVercelCoreMessage(message)) return this.addSystem(message);
    if (message.role === `system`) {
      throw new MastraError({
        id: "INVALID_SYSTEM_MESSAGE_FORMAT",
        domain: "AGENT" /* AGENT */,
        category: "USER" /* USER */,
        text: `Invalid system message format. System messages must be CoreMessage format with 'role' and 'content' properties. The content should be a string or valid content array.`,
        details: {
          messageSource,
          receivedMessage: JSON.stringify(message, null, 2)
        }
      });
    }
    const messageV2 = this.inputToMastraMessageV2(message, messageSource);
    const { exists, shouldReplace, id } = this.shouldReplaceMessage(messageV2);
    const latestMessage = this.messages.at(-1);
    const singleToolResult = messageV2.role === `assistant` && messageV2.content.parts.length === 1 && messageV2.content.parts[0]?.type === `tool-invocation` && messageV2.content.parts[0].toolInvocation.state === `result` && messageV2.content.parts[0];
    if (singleToolResult && (latestMessage?.role !== `assistant` || !latestMessage.content.parts.some(
      (p) => p.type === `tool-invocation` && p.toolInvocation.toolCallId === singleToolResult.toolInvocation.toolCallId
    ))) {
      return;
    }
    if (messageSource === `memory`) {
      for (const existingMessage of this.messages) {
        if (_MessageList.messagesAreEqual(existingMessage, messageV2)) {
          return;
        }
      }
    }
    const latestMessagePartType = latestMessage?.content?.parts?.filter((p) => p.type !== `step-start`)?.at?.(-1)?.type;
    const newMessageFirstPartType = messageV2.content.parts.filter((p) => p.type !== `step-start`).at(0)?.type;
    const shouldAppendToLastAssistantMessage = latestMessage?.role === "assistant" && messageV2.role === "assistant" && latestMessage.threadId === messageV2.threadId;
    const shouldMergeNewMessages = latestMessage && !this.memoryMessages.has(latestMessage) && messageSource !== "memory";
    const shouldAppendToLastAssistantMessageParts = shouldAppendToLastAssistantMessage && newMessageFirstPartType && (newMessageFirstPartType === `tool-invocation` && latestMessagePartType !== `text` || newMessageFirstPartType === latestMessagePartType && shouldMergeNewMessages);
    if (
      // backwards compat check!
      // this condition can technically be removed and it will make it so all new assistant parts will be added to the last assistant message parts instead of creating new db entries.
      // however, for any downstream code that isn't based around using message parts yet, this may cause tool invocations to show up in the wrong order in their UI, because they use the message.toolInvocations and message.content properties which do not indicate how each is ordered in relation to each other.
      // this code check then causes any tool invocation to be created as a new message and not update the previous assistant message parts.
      // without this condition we will see something like
      // parts: [{type:"step-start"}, {type: "text", text: "let me check the weather"}, {type: "tool-invocation", toolInvocation: x}, {type: "text", text: "the weather in x is y"}]
      // with this condition we will see
      // message1.parts: [{type:"step-start"}, {type: "text", text: "let me check the weather"}]
      // message2.parts: [{type: "tool-invocation", toolInvocation: x}]
      // message3.parts: [{type: "text", text: "the weather in x is y"}]
      shouldAppendToLastAssistantMessageParts
    ) {
      latestMessage.createdAt = messageV2.createdAt || latestMessage.createdAt;
      for (const [index, part] of messageV2.content.parts.entries()) {
        if (part.type === "tool-invocation" && part.toolInvocation.state === "result") {
          const existingCallPart = [...latestMessage.content.parts].reverse().find((p) => p.type === "tool-invocation" && p.toolInvocation.toolCallId === part.toolInvocation.toolCallId);
          if (existingCallPart && existingCallPart.type === "tool-invocation") {
            existingCallPart.toolInvocation = {
              ...existingCallPart.toolInvocation,
              state: "result",
              result: part.toolInvocation.result
            };
            if (!latestMessage.content.toolInvocations) {
              latestMessage.content.toolInvocations = [];
            }
            if (!latestMessage.content.toolInvocations.some(
              (t) => t.toolCallId === existingCallPart.toolInvocation.toolCallId
            )) {
              latestMessage.content.toolInvocations.push(existingCallPart.toolInvocation);
            }
          }
        } else if (
          // if there's no part at this index yet in the existing message we're merging into
          !latestMessage.content.parts[index] || // or there is and the parts are not identical
          _MessageList.cacheKeyFromParts([latestMessage.content.parts[index]]) !== _MessageList.cacheKeyFromParts([part])
        ) {
          latestMessage.content.parts.push(part);
        }
      }
      if (latestMessage.createdAt.getTime() < messageV2.createdAt.getTime()) {
        latestMessage.createdAt = messageV2.createdAt;
      }
      if (!latestMessage.content.content && messageV2.content.content) {
        latestMessage.content.content = messageV2.content.content;
      }
      if (latestMessage.content.content && messageV2.content.content && latestMessage.content.content !== messageV2.content.content) {
        latestMessage.content.content = messageV2.content.content;
      }
    } else {
      if (messageV2.role === "assistant" && messageV2.content.parts[0]?.type !== `step-start`) {
        messageV2.content.parts.unshift({ type: "step-start" });
      }
      const existingIndex = shouldReplace && this.messages.findIndex((m) => m.id === id) || -1;
      const existingMessage = existingIndex !== -1 && this.messages[existingIndex];
      if (shouldReplace && existingMessage) {
        this.messages[existingIndex] = messageV2;
      } else if (!exists) {
        this.messages.push(messageV2);
      }
      if (messageSource === `memory`) {
        this.memoryMessages.add(messageV2);
      } else if (messageSource === `response`) {
        this.newResponseMessages.add(messageV2);
      } else if (messageSource === `user`) {
        this.newUserMessages.add(messageV2);
      } else if (messageSource === `context`) {
        this.userContextMessages.add(messageV2);
      } else {
        throw new Error(`Missing message source for message ${messageV2}`);
      }
    }
    this.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return this;
  }
  inputToMastraMessageV2(message, messageSource) {
    if (
      // we can't throw if the threadId doesn't match and this message came from memory
      // this is because per-user semantic recall can retrieve messages from other threads
      messageSource !== `memory` && `threadId` in message && message.threadId && this.memoryInfo && message.threadId !== this.memoryInfo.threadId
    ) {
      throw new Error(
        `Received input message with wrong threadId. Input ${message.threadId}, expected ${this.memoryInfo.threadId}`
      );
    }
    if (`resourceId` in message && message.resourceId && this.memoryInfo?.resourceId && message.resourceId !== this.memoryInfo.resourceId) {
      throw new Error(
        `Received input message with wrong resourceId. Input ${message.resourceId}, expected ${this.memoryInfo.resourceId}`
      );
    }
    if (_MessageList.isMastraMessageV1(message)) {
      return this.mastraMessageV1ToMastraMessageV2(message, messageSource);
    }
    if (_MessageList.isMastraMessageV2(message)) {
      return this.hydrateMastraMessageV2Fields(message);
    }
    if (_MessageList.isVercelCoreMessage(message)) {
      return this.vercelCoreMessageToMastraMessageV2(message, messageSource);
    }
    if (_MessageList.isVercelUIMessage(message)) {
      return this.vercelUIMessageToMastraMessageV2(message, messageSource);
    }
    throw new Error(`Found unhandled message ${JSON.stringify(message)}`);
  }
  lastCreatedAt;
  // this makes sure messages added in order will always have a date atleast 1ms apart.
  generateCreatedAt(messageSource, start) {
    start = start instanceof Date ? start : start ? new Date(start) : void 0;
    if (start && !this.lastCreatedAt) {
      this.lastCreatedAt = start.getTime();
      return start;
    }
    if (start && messageSource === `memory`) {
      return start;
    }
    const now = /* @__PURE__ */ new Date();
    const nowTime = start?.getTime() || now.getTime();
    const lastTime = this.messages.reduce((p, m) => {
      if (m.createdAt.getTime() > p) return m.createdAt.getTime();
      return p;
    }, this.lastCreatedAt || 0);
    if (nowTime <= lastTime) {
      const newDate = new Date(lastTime + 1);
      this.lastCreatedAt = newDate.getTime();
      return newDate;
    }
    this.lastCreatedAt = nowTime;
    return now;
  }
  newMessageId() {
    if (this.generateMessageId) {
      return this.generateMessageId();
    }
    return randomUUID();
  }
  mastraMessageV1ToMastraMessageV2(message, messageSource) {
    const coreV2 = this.vercelCoreMessageToMastraMessageV2(
      {
        content: message.content,
        role: message.role
      },
      messageSource
    );
    return {
      id: message.id,
      role: coreV2.role,
      createdAt: this.generateCreatedAt(messageSource, message.createdAt),
      threadId: message.threadId,
      resourceId: message.resourceId,
      content: coreV2.content
    };
  }
  hydrateMastraMessageV2Fields(message) {
    if (!(message.createdAt instanceof Date)) message.createdAt = new Date(message.createdAt);
    return message;
  }
  vercelUIMessageToMastraMessageV2(message, messageSource) {
    const content = {
      format: 2,
      parts: message.parts
    };
    if (message.toolInvocations) content.toolInvocations = message.toolInvocations;
    if (message.reasoning) content.reasoning = message.reasoning;
    if (message.annotations) content.annotations = message.annotations;
    if (message.experimental_attachments) {
      content.experimental_attachments = message.experimental_attachments;
    }
    return {
      id: message.id || this.newMessageId(),
      role: _MessageList.getRole(message),
      createdAt: this.generateCreatedAt(messageSource, message.createdAt),
      threadId: this.memoryInfo?.threadId,
      resourceId: this.memoryInfo?.resourceId,
      content
    };
  }
  vercelCoreMessageToMastraMessageV2(coreMessage, messageSource) {
    const id = `id` in coreMessage ? coreMessage.id : this.newMessageId();
    const parts = [];
    const experimentalAttachments = [];
    const toolInvocations = [];
    if (typeof coreMessage.content === "string") {
      parts.push({ type: "step-start" });
      parts.push({
        type: "text",
        text: coreMessage.content
      });
    } else if (Array.isArray(coreMessage.content)) {
      for (const part of coreMessage.content) {
        switch (part.type) {
          case "text":
            parts.push({
              type: "text",
              text: part.text
            });
            break;
          case "tool-call":
            parts.push({
              type: "tool-invocation",
              toolInvocation: {
                state: "call",
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                args: part.args
              }
            });
            break;
          case "tool-result":
            const invocation = {
              state: "result",
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              result: part.result ?? "",
              // undefined will cause AI SDK to throw an error, but for client side tool calls this really could be undefined
              args: {}
              // when we combine this invocation onto the existing tool-call part it will have args already
            };
            parts.push({
              type: "tool-invocation",
              toolInvocation: invocation
            });
            toolInvocations.push(invocation);
            break;
          case "reasoning":
            parts.push({
              type: "reasoning",
              reasoning: "",
              // leave this blank so we aren't double storing it in the db along with details
              details: [{ type: "text", text: part.text, signature: part.signature }]
            });
            break;
          case "redacted-reasoning":
            parts.push({
              type: "reasoning",
              reasoning: "",
              // No text reasoning for redacted parts
              details: [{ type: "redacted", data: part.data }]
            });
            break;
          case "image":
            parts.push({ type: "file", data: part.image.toString(), mimeType: part.mimeType });
            break;
          case "file":
            if (part.data instanceof URL) {
              parts.push({
                type: "file",
                data: part.data.toString(),
                mimeType: part.mimeType
              });
            } else {
              try {
                parts.push({
                  type: "file",
                  mimeType: part.mimeType,
                  data: convertDataContentToBase64String(part.data)
                });
              } catch (error) {
                console.error(`Failed to convert binary data to base64 in CoreMessage file part: ${error}`, error);
              }
            }
            break;
        }
      }
    }
    const content = {
      format: 2,
      parts
    };
    if (toolInvocations.length) content.toolInvocations = toolInvocations;
    if (typeof coreMessage.content === `string`) content.content = coreMessage.content;
    if (experimentalAttachments.length) content.experimental_attachments = experimentalAttachments;
    return {
      id,
      role: _MessageList.getRole(coreMessage),
      createdAt: this.generateCreatedAt(messageSource),
      threadId: this.memoryInfo?.threadId,
      resourceId: this.memoryInfo?.resourceId,
      content
    };
  }
  static isVercelUIMessage(msg) {
    return !_MessageList.isMastraMessage(msg) && isUiMessage(msg);
  }
  static isVercelCoreMessage(msg) {
    return !_MessageList.isMastraMessage(msg) && isCoreMessage(msg);
  }
  static isMastraMessage(msg) {
    return _MessageList.isMastraMessageV2(msg) || _MessageList.isMastraMessageV1(msg);
  }
  static isMastraMessageV1(msg) {
    return !_MessageList.isMastraMessageV2(msg) && (`threadId` in msg || `resourceId` in msg);
  }
  static isMastraMessageV2(msg) {
    return Boolean(
      msg.content && !Array.isArray(msg.content) && typeof msg.content !== `string` && // any newly saved Mastra message v2 shape will have content: { format: 2 }
      `format` in msg.content && msg.content.format === 2
    );
  }
  static getRole(message) {
    if (message.role === `assistant` || message.role === `tool`) return `assistant`;
    if (message.role === `user`) return `user`;
    throw new Error(
      `BUG: add handling for message role ${message.role} in message ${JSON.stringify(message, null, 2)}`
    );
  }
  static cacheKeyFromParts(parts) {
    let key = ``;
    for (const part of parts) {
      key += part.type;
      if (part.type === `text`) {
        key += part.text.length;
      }
      if (part.type === `tool-invocation`) {
        key += part.toolInvocation.toolCallId;
        key += part.toolInvocation.state;
      }
      if (part.type === `reasoning`) {
        key += part.reasoning.length;
        key += part.details.reduce((prev, current) => {
          if (current.type === `text`) {
            return prev + current.text.length + (current.signature?.length || 0);
          }
          return prev;
        }, 0);
      }
      if (part.type === `file`) {
        key += part.data.length;
        key += part.mimeType;
      }
    }
    return key;
  }
  static coreContentToString(content) {
    if (typeof content === `string`) return content;
    return content.reduce((p, c) => {
      if (c.type === `text`) {
        p += c.text;
      }
      return p;
    }, "");
  }
  static cacheKeyFromContent(content) {
    if (typeof content === `string`) return content;
    let key = ``;
    for (const part of content) {
      key += part.type;
      if (part.type === `text`) {
        key += part.text.length;
      }
      if (part.type === `reasoning`) {
        key += part.text.length;
      }
      if (part.type === `tool-call`) {
        key += part.toolCallId;
        key += part.toolName;
      }
      if (part.type === `tool-result`) {
        key += part.toolCallId;
        key += part.toolName;
      }
      if (part.type === `file`) {
        key += part.filename;
        key += part.mimeType;
      }
      if (part.type === `image`) {
        key += part.image instanceof URL ? part.image.toString() : part.image.toString().length;
        key += part.mimeType;
      }
      if (part.type === `redacted-reasoning`) {
        key += part.data.length;
      }
    }
    return key;
  }
  static messagesAreEqual(one, two) {
    const oneUI = _MessageList.isVercelUIMessage(one) && one;
    const twoUI = _MessageList.isVercelUIMessage(two) && two;
    if (oneUI && !twoUI) return false;
    if (oneUI && twoUI) {
      return _MessageList.cacheKeyFromParts(one.parts) === _MessageList.cacheKeyFromParts(two.parts);
    }
    const oneCM = _MessageList.isVercelCoreMessage(one) && one;
    const twoCM = _MessageList.isVercelCoreMessage(two) && two;
    if (oneCM && !twoCM) return false;
    if (oneCM && twoCM) {
      return _MessageList.cacheKeyFromContent(oneCM.content) === _MessageList.cacheKeyFromContent(twoCM.content);
    }
    const oneMM1 = _MessageList.isMastraMessageV1(one) && one;
    const twoMM1 = _MessageList.isMastraMessageV1(two) && two;
    if (oneMM1 && !twoMM1) return false;
    if (oneMM1 && twoMM1) {
      return oneMM1.id === twoMM1.id && _MessageList.cacheKeyFromContent(oneMM1.content) === _MessageList.cacheKeyFromContent(twoMM1.content);
    }
    const oneMM2 = _MessageList.isMastraMessageV2(one) && one;
    const twoMM2 = _MessageList.isMastraMessageV2(two) && two;
    if (oneMM2 && !twoMM2) return false;
    if (oneMM2 && twoMM2) {
      return oneMM2.id === twoMM2.id && _MessageList.cacheKeyFromParts(oneMM2.content.parts) === _MessageList.cacheKeyFromParts(twoMM2.content.parts);
    }
    return true;
  }
};

export { MessageList as M };
