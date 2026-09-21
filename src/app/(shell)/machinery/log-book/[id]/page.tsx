"use client";

import React, { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LogBookTransactionForm } from "@/components/machinery/LogBookTransactionForm";

function LogBookDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const isView = searchParams.get("view") === "true";

  if (!id) return null;

  return (
    <LogBookTransactionForm
      mode={isView ? "view" : "edit"}
      initialLogId={id}
    />
  );
}

export default function LogBookDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LogBookDetailContent />
    </Suspense>
  );
}

