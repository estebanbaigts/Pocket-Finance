export interface Insight {
  id: string
  tone: 'info' | 'warning' | 'action'
  title: string
  /** Données et hypothèses qui justifient le constat : chaque recommandation est explicable. */
  evidence: string[]
}
