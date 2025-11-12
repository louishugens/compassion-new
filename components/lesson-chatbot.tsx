"use client";

import { useChat } from "@ai-sdk/react";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
// import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { 
  PromptInput, 
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage 
} from "@/components/ai-elements/prompt-input";
import { Loader } from "@/components/ai-elements/loader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Id } from "@/convex/_generated/dataModel";
import { Fragment, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface LessonChatbotProps {
  lessonId: Id<"lessons">;
}

export function LessonChatbot({ lessonId }: LessonChatbotProps) {
  const [input, setInput] = useState<string>("");
  const currentUser = useQuery(api.users.getCurrentUserWithAssignments);

  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat",
    onError: (error: any) => {
      console.error("useChat error:", error);
    },
    onFinish: (message: any) => {
      console.log("Message finished:", message);
    },
  } as any);

  // Log messages and status changes
  console.log("Chatbot state:", { 
    messageCount: messages.length, 
    status, 
    hasError: !!error,
    errorMessage: error?.message 
  });

  const handleSubmit = (message: PromptInputMessage) => {
    // Get text from message or fallback to local input state
    let textContent = "";
    if (message && "text" in message && message.text) {
      textContent = message.text;
    } else if (input.trim()) {
      textContent = input.trim();
    }

    if (!textContent.trim()) {
      console.warn("No text content to send");
      return;
    }

    console.log("Sending message:", { textContent, lessonId });

    // Send message with lessonId in body
    sendMessage(
      { 
        text: textContent,
      },
      {
        body: {
          lessonId,
        },
      }
    ).catch((err) => {
      console.error("Error sending message:", err);
    });

    // Clear the input
    setInput("");
  };

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Aucun message"
              description="Posez une question sur la leçon pour commencer"
            />
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";
              const userInitial = currentUser?.firstName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || "U";
              
              return (
                <Fragment key={message.id}>
                  {message.parts?.map((part: any, i: number) => {
                    const isLastPart = i === (message.parts?.length || 0) - 1;
                    const isStreaming = status === "streaming" && isLastPart && message.id === messages[messages.length - 1]?.id;
                    
                    switch (part.type) {
                      case "text":
                        return (
                          <div key={`${message.id}-${i}`} className={`flex gap-3 w-full ${isUser ? "justify-end" : "justify-start"}`}>
                            {!isUser && (
                              <Avatar className="size-8 shrink-0">
                                <AvatarFallback className="bg-blue-100 text-blue-800">
                                  ✝
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <Message from={message.role}>
                              <MessageContent>
                                <MessageResponse>{part.text}</MessageResponse>
                              </MessageContent>
                            </Message>
                            {isUser && (
                              <Avatar className="size-8 shrink-0">
                                <AvatarFallback className="bg-blue-100 text-blue-800">
                                  {userInitial}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      // case "reasoning":
                      //   return (
                      //     <Reasoning
                      //       key={`${message.id}-${i}`}
                      //       className="w-full"
                      //       isStreaming={isStreaming}
                      //     >
                      //       <ReasoningTrigger />
                      //       <ReasoningContent>{part.text}</ReasoningContent>
                      //     </Reasoning>
                      //   );
                      default:
                        return null;
                    }
                  }) || (
                    // Fallback for messages without parts structure
                    <div className={`flex gap-3 w-full ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            ✝
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <Message key={message.id} from={message.role}>
                        <MessageContent>
                          <MessageResponse>{String((message as any).content || "")}</MessageResponse>
                        </MessageContent>
                      </Message>
                      {isUser && (
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                </Fragment>
              );
            })
          )}
          {(() => {
            // Show loader when submitted or streaming, but only if no assistant message content has appeared yet
            const lastMessage = messages[messages.length - 1];
            const hasAssistantContent = lastMessage && 
              lastMessage.role === "assistant" && 
              lastMessage.parts && 
              lastMessage.parts.some((p: any) => p.type === "text" && p.text && p.text.trim().length > 0);
            
            // Show loader if submitted, or if streaming but no content has appeared yet
            const shouldShowLoader = status === "submitted" || (status === "streaming" && !hasAssistantContent);
            return shouldShowLoader && <Loader />;
          })()}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t">
          Erreur: {error.message || "Une erreur est survenue lors de l'envoi du message"}
        </div>
      )}

      <div className="w-full px-4 pb-4 pt-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder="Posez une question sur la leçon..."
            />
          </PromptInputBody>
          <PromptInputFooter className="flex justify-end items-center">
            <PromptInputSubmit 
              disabled={!input.trim() && !status} 
              status={status}
              className="bg-blue-800 hover:bg-blue-900 text-white border-blue-800"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}


