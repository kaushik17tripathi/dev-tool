"use client";

import { ViewStateProvider } from "@/context/ViewStateContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import WorkspaceApp from "@/components/workspace/WorkspaceApp";

export default function AppRoot({ initialView }: { initialView?: import("@/context/WorkspaceContext").WorkspaceView }) {
  return (
    <WorkspaceProvider initialView={initialView}>
      <ViewStateProvider>
        <WorkspaceApp />
      </ViewStateProvider>
    </WorkspaceProvider>
  );
}
