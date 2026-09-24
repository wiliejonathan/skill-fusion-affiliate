export type ScoreInputs = {
  relevance: number;
  buyerIntent: number;
  value: number;
  trend: number;
  economics: number;
  confidence: number;
  freshness: number;
  content: number;
};

const weights = {
  relevance: 0.20,
  buyerIntent: 0.18,
  value: 0.14,
  trend: 0.14,
  economics: 0.12,
  confidence: 0.08,
  freshness: 0.07,
  content: 0.07
};

function clamp(value:number){
  return Math.max(0,Math.min(100,value));
}

export function skillFusionScore(input:ScoreInputs){
  const score =
    clamp(input.relevance)*weights.relevance +
    clamp(input.buyerIntent)*weights.buyerIntent +
    clamp(input.value)*weights.value +
    clamp(input.trend)*weights.trend +
    clamp(input.economics)*weights.economics +
    clamp(input.confidence)*weights.confidence +
    clamp(input.freshness)*weights.freshness +
    clamp(input.content)*weights.content;

  return Math.round(score*100)/100;
}

export function qualityGate(input:{name?:string;productUrl?:string;price?:number;imageUrl?:string}){
  if(!input.name || !input.productUrl) return "FAIL" as const;
  if(!input.price || input.price<=0 || !input.imageUrl) return "CHECK" as const;
  return "PASS" as const;
}
