// WorkHub Event System for real-time UI synchronization

export const WORKHUB_WORKSPACE_UPDATED_EVENT = 'workhub-workspace-updated';

export const dispatchWorkhubWorkspaceUpdated = (workspaceId: string) => {
  const event = new CustomEvent(WORKHUB_WORKSPACE_UPDATED_EVENT, {
    detail: { workspaceId },
  });
  window.dispatchEvent(event);
};

export const onWorkhubWorkspaceUpdated = (
  callback: (workspaceId: string) => void
) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail?.workspaceId);
  };

  window.addEventListener(WORKHUB_WORKSPACE_UPDATED_EVENT, handler);

  return () => {
    window.removeEventListener(WORKHUB_WORKSPACE_UPDATED_EVENT, handler);
  };
};
