/**
 * Utils.
*/

export async function sleep(minutes: number) {
  return new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
}
