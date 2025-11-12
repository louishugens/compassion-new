"use client";

import { LessonChatbot } from "@/components/lesson-chatbot";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Id } from "@/convex/_generated/dataModel";

interface LessonChatbotModalProps {
  lessonId: Id<"lessons">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LessonChatbotModal({
  lessonId,
  open,
  onOpenChange,
}: LessonChatbotModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] h-[600px] flex flex-col p-0 gap-0 fixed bottom-8 right-8 top-auto left-auto translate-x-0 translate-y-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-blue-800">Aide à la compréhension</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-6">
          <LessonChatbot lessonId={lessonId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

