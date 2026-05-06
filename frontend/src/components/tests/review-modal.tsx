import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ReviewModal({
  isOpen,
  answered,
  total,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  answered: number;
  total: number;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit test?">
      <p className="text-sm leading-7 text-muted">
        You answered {answered} of {total} questions. Once submitted, answers cannot be changed.
      </p>
      <div className="mt-6 flex gap-3">
        <Button type="button" onClick={onSubmit}>Submit</Button>
        <Button type="button" onClick={onClose} variant="secondary">Review again</Button>
      </div>
    </Modal>
  );
}
