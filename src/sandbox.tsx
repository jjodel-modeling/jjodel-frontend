export const uselessexport = {}

/*


todo:

coerenza conflitti:
- roolback se dal server ricevi una azione con tempo precedente all'ultima azione eseguita localmente.
  il rollback procede fino alla prima azione con timestamp più vecchio di quella ricevuta dal server. poi riesecuzione riorinando le azioni by timestamp & user id in caso di same timestamp.
- questo implica un funzionamento completo e perfetto di undo/redo.
- in reducer, edit +=, -= actions, vengono effettivamente "eseguite", ma poi modificate in:
    (+=)    "path.to.array.INDEX = value_inserted"      OR
    (-=)    "path.to.array = [value_post_deletion]"     e il server deve riceverle solo in questa forma.

- sometimes deletion by setting undefined does not work well,
   consider replacing it with a special "delete" value with unicode chars that are unlikely to be found (like "←¦dëletê┤" },
   when an action is attempting to set that val, it triggers (delete object[key]) instead

all GraphElement utilities
going down;
- subVertexes
- subFields
- edges
...

going up:
- graph (rework)
- vertex
- edge (from edgepoint)

coerenza con LModelElement:
- father
- childrens
...












 */
