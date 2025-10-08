import { useUploadProgress } from "../../../hooks/useUploadProgress";
import "./UploadProgress.css";

interface Props {
  uploadId: string;
  onComplete?: () => void;
  onClose?: () => void;
}
export function UploadProgress({ uploadId, onComplete, onClose }: Props) {
  const { progress, error } = useUploadProgress(uploadId, {
    onComplete: () => {
      console.log("Upload completed!");
      onComplete?.();
    },
  });

  if (error) {
    return (
      <div className="upload-progress-card error">
        <div className="upload-progress-header">
          <h3>❌ Upload Error</h3>
          {onClose && <button onClick={onClose}>×</button>}
        </div>
        <p className="error-message">{error.message}</p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="upload-progress-card">
        <div className="upload-progress-header">
          <h3>⏳ Loading Progress...</h3>
        </div>
      </div>
    );
  }

  const csvProgress =
    progress.totalRows > 0
      ? (progress.processedRows / progress.totalRows) * 100
      : 0;

  const geocodingProgress =
    progress.geocodingProgress.total > 0
      ? (progress.geocodingProgress.completed /
          progress.geocodingProgress.total) *
        100
      : 0;

  const remainingClients =
    progress.geocodingProgress.total - progress.geocodingProgress.completed;
  const estimatedSeconds = remainingClients;

  return (
    <div className="upload-progress-card">
      <div className="upload-progress-header">
        <h3>
          {progress.status === "processing" && "📄 Processing CSV..."}
          {progress.status === "geocoding" && "🌍 Geocoding..."}
          {progress.status === "completed" && "✅ Completed!"}
          {progress.status === "failed" && "❌ Failed"}
        </h3>
        {onClose && progress.status === "completed" && (
          <button onClick={onClose}>×</button>
        )}
      </div>

      <div className="upload-progress-body">
        <div className="status-badge" data-status={progress.status}>
          {progress.status}
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <span>CSV Processing</span>
            <span>
              {progress.processedRows} / {progress.totalRows}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${csvProgress}%` }}
            />
          </div>
          <div className="progress-stats">
            <span className="stat-success">
              ✓ {progress.createdClients} created
            </span>
            <span className="stat-warning">⚠ {progress.skipped} skipped</span>
            <span className="stat-error">✗ {progress.errors} errors</span>
          </div>
        </div>

        {(progress.status === "geocoding" ||
          progress.status === "completed") && (
          <div className="progress-section">
            <div className="progress-header">
              <span>Geocoding</span>
              <span>
                {progress.geocodingProgress.completed} /{" "}
                {progress.geocodingProgress.total}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill geocoding"
                style={{ width: `${geocodingProgress}%` }}
              />
            </div>
            {progress.status === "geocoding" && remainingClients > 0 && (
              <p className="time-estimate">
                ⏱ ~{estimatedSeconds} seconds remaining
              </p>
            )}
          </div>
        )}

        {(progress.status === "processing" ||
          progress.status === "geocoding") && (
          <div className="live-indicator">
            <span className="pulse"></span>
            <span>Live updates</span>
          </div>
        )}
      </div>
    </div>
  );
}
