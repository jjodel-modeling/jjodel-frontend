#!/usr/bin/env python3
"""Generate the synthetic benchmark model: bench.ecore (metamodel) + bench.xmi (M1).

Deterministic (seed 42). Defaults: 500 Task objects, 1000 next-links.
Mirrors the Graph.ecore fixture pattern (root container + xmi:id references),
which is the format the XMI importer is tested against.
Usage: python3 generate_synthetic_model.py [nodes] [edges] [outdir]
"""
import sys, random

def main():
    n_nodes = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    n_edges = int(sys.argv[2]) if len(sys.argv) > 2 else 1000
    outdir = sys.argv[3] if len(sys.argv) > 3 else '.'
    rng = random.Random(42)

    ecore = '''<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0"
                xmlns:xmi="http://www.omg.org/XMI"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
                name="bench">
  <eClassifiers xsi:type="ecore:EClass" name="Board">
    <eStructuralFeatures xsi:type="ecore:EReference" name="tasks" upperBound="-1" containment="true" eType="#//Task"/>
  </eClassifiers>
  <eClassifiers xsi:type="ecore:EClass" name="Task">
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="name" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"/>
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="done" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBoolean"/>
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="weight" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt"/>
    <eStructuralFeatures xsi:type="ecore:EReference" name="next" upperBound="-1" eType="#//Task"/>
  </eClassifiers>
</ecore:EPackage>
'''
    edges = {}
    count = 0
    while count < n_edges:
        src = rng.randrange(n_nodes)
        tgt = rng.randrange(n_nodes)
        if tgt in edges.setdefault(src, set()):
            continue
        edges[src].add(tgt)
        count += 1
    items = []
    for i in range(n_nodes):
        nexts = ' '.join(f't{t}' for t in sorted(edges.get(i, ())))
        next_attr = f' next="{nexts}"' if nexts else ''
        items.append(
            f'  <tasks xmi:id="t{i}" name="task_{i}" done="{str(i % 2 == 0).lower()}"'
            f' weight="{i % 10}"{next_attr}/>')
    xmi = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<Board xmi:version="2.0"\n'
           '       xmlns:xmi="http://www.omg.org/XMI"\n'
           '       xmlns="bench">\n'
           + '\n'.join(items) + '\n</Board>\n')

    with open(f'{outdir}/bench.ecore', 'w') as f: f.write(ecore)
    with open(f'{outdir}/bench.xmi', 'w') as f: f.write(xmi)
    print(f'wrote bench.ecore and bench.xmi ({n_nodes} tasks, {count} links) to {outdir}')

if __name__ == '__main__':
    main()
