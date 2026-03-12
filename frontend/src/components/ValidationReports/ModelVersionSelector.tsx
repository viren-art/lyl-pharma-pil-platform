import React from 'react';

interface LLMModel {
  id: number;
  modelVersion: string;
  baseModel: string;
  status: string;
  description: string;
  activatedAt: string | null;
  validatedBy: {
    fullName: string;
  } | null;
  validatedAt: string | null;
}

interface ModelVersionSelectorProps {
  models: LLMModel[];
  selectedModel: LLMModel | null;
  onSelectModel: (model: LLMModel) => void;
}

export const ModelVersionSelector: React.FC<ModelVersionSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
}) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'deprecated':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'testing':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Select Model Version</h2>
      <div className="space-y-3">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => onSelectModel(model)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedModel?.id === model.id
                ? 'bg-violet-500/10 border-violet-500/50 shadow-lg shadow-violet-500/10'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-white">{model.modelVersion}</h3>
                <p className="text-sm text-zinc-400 mt-1">{model.description}</p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  model.status
                )}`}
              >
                {model.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5">
              <div>
                <p className="text-xs text-zinc-500">Base Model</p>
                <p className="text-sm text-zinc-300 mt-1">{model.baseModel}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Activated</p>
                <p className="text-sm text-zinc-300 mt-1">{formatDate(model.activatedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Validated By</p>
                <p className="text-sm text-zinc-300 mt-1">
                  {model.validatedBy?.fullName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Validated At</p>
                <p className="text-sm text-zinc-300 mt-1">{formatDate(model.validatedAt)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};