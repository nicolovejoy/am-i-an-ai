import { Button } from './ui';

interface CorrectionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  original: string;
  corrected: string;
  changes: Array<{
    original: string;
    corrected: string;
    type: string;
  }>;
  onAccept: () => void;
  onReject: () => void;
}

export default function CorrectionPreview({
  isOpen,
  onClose,
  original,
  corrected,
  changes,
  onAccept,
  onReject,
}: CorrectionPreviewProps) {
  const highlightChanges = (text: string, isOriginal: boolean) => {
    if (changes.length === 0) return text;
    
    let highlighted = text;
    changes.forEach(change => {
      const searchFor = isOriginal ? change.original : change.corrected;
      const className = isOriginal 
        ? 'line-through text-red-600' 
        : 'bg-green-100 text-green-800';
      
      highlighted = highlighted.replace(
        new RegExp(`\\b${searchFor}\\b`, 'g'),
        `<span class="${className}">${searchFor}</span>`
      );
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Polish Your Response
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Original:</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                  {highlightChanges(original, true)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Polished:</label>
                <div className="mt-1 p-3 bg-blue-50 rounded-lg text-sm">
                  {highlightChanges(corrected, false)}
                </div>
              </div>

              {changes.length > 0 && (
                <div className="text-sm text-gray-600">
                  {changes.length} correction{changes.length !== 1 ? 's' : ''} suggested
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1"
              >
                Use Polished Version
              </Button>
              <Button
                onClick={() => {
                  onReject();
                  onClose();
                }}
                variant="secondary"
                className="flex-1"
              >
                Keep Original
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}