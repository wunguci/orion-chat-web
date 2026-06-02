import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import type { OnlyOfficeConfigResponse } from "../../../features/work-hub/work-hub.api.types";

type OnlyOfficeEditor = {
  destroyEditor?: () => void;
};

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (
        elementId: string,
        config: OnlyOfficeConfigResponse["config"],
      ) => OnlyOfficeEditor;
    };
  }
}

const loadOnlyOfficeScript = (documentServerUrl: string) => {
  if (window.DocsAPI?.DocEditor) return Promise.resolve();

  const scriptUrl = `${documentServerUrl.replace(/\/+$/, "")}/web-apps/apps/api/documents/api.js`;
  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-onlyoffice-api="${scriptUrl}"]`,
  );

  if (existing) {
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.dataset.onlyofficeApi = scriptUrl;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Cannot load ONLYOFFICE editor"));
    document.body.appendChild(script);
  });
};

const FileEditorPage = () => {
  const { workspaceId, fileId } = useParams<{
    workspaceId: string;
    fileId: string;
  }>();
  const navigate = useNavigate();
  const editorRef = useRef<OnlyOfficeEditor | null>(null);
  const [title, setTitle] = useState("Office editor");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;

    let cancelled = false;

    const bootEditor = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await workHubApi.getOnlyOfficeConfig(fileId);
        if (cancelled) return;

        setTitle(response.config.document.title);
        await loadOnlyOfficeScript(response.documentServerUrl);
        if (cancelled) return;

        const container = document.getElementById("onlyoffice-editor");
        if (container) container.innerHTML = "";

        editorRef.current?.destroyEditor?.();
        editorRef.current = new window.DocsAPI!.DocEditor(
          "onlyoffice-editor",
          response.config,
        );
      } catch (err) {
        console.error("Failed to open ONLYOFFICE editor:", err);
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Cannot open this file in editor",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootEditor();

    return () => {
      cancelled = true;
      editorRef.current?.destroyEditor?.();
      editorRef.current = null;
    };
  }, [fileId]);

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)] flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/work-hub/${workspaceId}/files`)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-gray-900">
              {title}
            </h1>
            <p className="text-xs text-gray-500">ONLYOFFICE collaborative edit</p>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-wh-green-primary border-t-transparent"></div>
          </div>
        )}

        {error ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-md rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : (
          <div id="onlyoffice-editor" className="h-full w-full" />
        )}
      </div>
    </div>
  );
};

export default FileEditorPage;
