import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TaskExecutionPanel } from './TaskExecutionPanel';
import { ResultsShowcase } from './ResultsShowcase';

export function RightPanel({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Right Panel */}
      <aside
        className={`fixed right-0 top-0 h-screen w-80 bg-card border-l border-border transform transition-transform duration-300 z-50 lg:relative lg:translate-x-0 flex flex-col overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Execução</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="lg:hidden"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <TaskExecutionPanel />
          <ResultsShowcase />
        </div>


      </aside>
    </>
  );
}
