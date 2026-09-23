// Deliberately supplied practice values, never a live electricity tariff.
export function electricityCost(watts:number,hours:number,rate:number){
  return Math.round(watts*hours*rate/1000*100)/100;
}
