import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ReviewModal({
  isOpen,
  answered,
  total,
  marked = 0,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  answered: number;
  total: number;
  marked?: number;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const notAnswered = Math.max(0, total - answered);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit test?">
      <div className="grid gap-3 text-sm text-[#071d36] sm:grid-cols-3">
        <span className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold">Answered {answered}</span>
        <span className="rounded border border-red-200 bg-red-50 px-3 py-2 font-semibold">Not answered {notAnswered}</span>
        <span className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 font-semibold">Marked {marked}</span>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#64748b]">Once submitted, answers cannot be changed.</p>
      <div className="mt-6 flex gap-3">
        <Button type="button" onClick={onSubmit}>Submit</Button>
        <Button type="button" onClick={onClose} variant="secondary">Review again</Button>
      </div>
    </Modal>
  );
}
