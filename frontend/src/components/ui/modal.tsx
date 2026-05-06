"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function Modal({ children, isOpen, onClose, title }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-deep/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <Button variant="secondary" size="sm" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        <div className="pt-5">{children}</div>
      </Card>
    </div>
  );
}

