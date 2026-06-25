import api from './axiosInstance'

export interface RuleConfiguration {
  id: string
  blockThreshold: number
  reviewThreshold: number
  autoBlockEnabled: boolean
  autoAlertEnabled: boolean
  blockMaliciousLabels: boolean
  updatedAt: string
  updatedByEmail?: string | null
}

export interface UpdateRuleConfigurationRequest {
  blockThreshold?: number
  reviewThreshold?: number
  autoBlockEnabled?: boolean
  autoAlertEnabled?: boolean
  blockMaliciousLabels?: boolean
}

export const ruleEngineApi = {
  getConfig: async (): Promise<RuleConfiguration> => {
    const res = await api.get<RuleConfiguration>('/rule-engine/config')
    return res.data
  },

  updateConfig: async (req: UpdateRuleConfigurationRequest): Promise<RuleConfiguration> => {
    const res = await api.patch<RuleConfiguration>('/rule-engine/config', req)
    return res.data
  },
}
