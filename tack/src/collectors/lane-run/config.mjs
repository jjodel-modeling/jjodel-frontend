// lane-run's configuration as a trace source (../source.mjs): the id syntax of its units. A unit is a Jjodel prompt,
// named by its Prompt-ID, P-YYYY-MM-DD-HHmm with an optional -suffix; a ticket is found in a prompt or a chat (C-...).
export const LANE_RUN_IDS = Object.freeze({
  unit: /^P-\d{4}-\d{2}-\d{2}-\d{4}(-[a-z0-9]{1,8})?$/,
  unitForm: 'P-YYYY-MM-DD-HHmm with an optional -suffix',
  ref: /^[PC]-\d{4}-\d{2}-\d{2}-\d{4}/,
  refForm: 'a P-... or C-... id',
});
