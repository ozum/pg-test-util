/** Type to store entity details.  */
export type EntityInfo = {
  /** Schema name of the entity. */
  schema: string;
  /** Entity name */
  name: string;
};

export type SequenceInfo = {
  /** Schema name of the table sequence is defined. */
  schema: string;
  /** Table name of the sequence. */
  table: string;
  /** Column name which sequence is related to. */
  column: string;
  /** Name of the sequence */
  name: string;
};
