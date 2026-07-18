import { AlertCircle, CheckCircle2, Wrench } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { StatusPill } from '@/components/common/StatusPill';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useIntegrationConfigByType } from '@/hooks/integrations/useIntegrationRuntime';

interface IntegrationStatusBannerProps {
  integrationType: string;
  sourceModule?: string;
  workflowLabel: string;
}

type WorkflowIntegrationState = 'manualOnly' | 'ready' | 'failed';

function getWorkflowState(
  config: {
    isActive: boolean;
    healthStatus: string;
    provider: string;
  } | null | undefined,
): WorkflowIntegrationState {
  if (!config || !config.isActive) {
    return 'manualOnly';
  }
  if (config.healthStatus === 'DOWN' || config.healthStatus === 'DEGRADED') {
    return 'failed';
  }
  return 'ready';
}

export function IntegrationStatusBanner({
  integrationType,
  sourceModule,
  workflowLabel,
}: IntegrationStatusBannerProps) {
  const navigate = useNavigate();
  const configQuery = useIntegrationConfigByType(integrationType);

  const state = useMemo(
    () => getWorkflowState(configQuery.data),
    [configQuery.data],
  );

  const copy = useMemo(() => {
    if (configQuery.isLoading) {
      return {
        icon: <Wrench className="h-4 w-4" />,
        title: `${workflowLabel} integration status`,
        description: 'Loading provider status for this workflow.',
      };
    }
    if (state === 'ready' && configQuery.data) {
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        title: `${workflowLabel} automation is available`,
        description: `${configQuery.data.provider} is configured and can assist this workflow. Manual actions remain available on the same screen.`,
      };
    }
    if (state === 'failed' && configQuery.data) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        title: `${workflowLabel} automation needs operator review`,
        description: `${configQuery.data.provider} is configured but currently degraded. Continue manually and review the exception queue for failed runs or webhook follow-up.`,
      };
    }
    return {
      icon: <Wrench className="h-4 w-4" />,
      title: `${workflowLabel} is operating in manual-first mode`,
      description:
        'No active provider is configured for this workflow. Manual operations remain the release path until automation is approved and stable.',
    };
  }, [configQuery.data, configQuery.isLoading, state, workflowLabel]);

  return (
    <Alert className="border-slate-200 bg-slate-50/80">
      {copy.icon}
      <AlertTitle className="flex items-center gap-2">
        {copy.title}
        <StatusPill type="application" status={state} />
      </AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
        <span>{copy.description}</span>
        <span className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/settings/integrations')}
          >
            Integration settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/admin/settings/integrations/operations?integrationType=${integrationType}${
                  sourceModule ? `&sourceModule=${sourceModule}` : ''
                }`,
              )
            }
          >
            Open operations
          </Button>
        </span>
      </AlertDescription>
    </Alert>
  );
}
