#!/usr/bin/env python3
"""Generates the golden fixtures of exprGolden.test.ts (P-2026-11-08-2345, R-EXP-8). Run from an empty temporary
directory holding copies of Brief.ecore and ddr4_closed_v.xmi: brief_view.py writes a temporary file beside its input,
and nothing may be written under micron-proto. The Homebrew python3 has a broken pyexpat on this machine, so:

    cp <micron-proto>/out/dram/jjodel/{Brief.ecore,ddr4_closed_v.xmi} "$D"
    /usr/bin/python3 -I <micron-proto>/tools/kernel/brief_view.py "$D/ddr4_closed_v.xmi" > ddr4_closed_v.brief.txt
    /usr/bin/python3 <micron-proto>/tools/kernel/kxmi.py read "$D/ddr4_closed_v.xmi" "$D/kernel.json"
    /usr/bin/python3 -I gen_fixture.py "$D/Brief.ecore" "$D/kernel.json" > ddr4_closed_v.model.json

The first command's output has md5 5ae1f8e6d1c3ac77831ef8cd1b6105d2, the same as out/dram/views/ddr4_closed_v.brief.txt.
"""
import json
import sys
import xml.etree.ElementTree as ET

XSI = '{http://www.w3.org/2001/XMLSchema-instance}type'


def classes(path):
    out = []
    for c in ET.parse(path).getroot().iter('eClassifiers'):
        if c.get(XSI) != 'ecore:EClass':
            continue
        supers = [s.split('//')[-1] for s in (c.get('eSuperTypes') or '').split() if s]
        attrs, refs = [], []
        for f in c.findall('eStructuralFeatures'):
            if f.get(XSI) == 'ecore:EAttribute':
                attrs.append(f.get('name'))
            else:
                refs.append({'name': f.get('name'), 'composition': f.get('containment') == 'true'})
        out.append({'name': c.get('name'), 'abstract': c.get('abstract') == 'true', 'supers': supers,
                    'attributes': attrs, 'references': refs})
    return out


json.dump({'classes': classes(sys.argv[1]), 'kernel': json.load(open(sys.argv[2]))}, sys.stdout, separators=(',', ':'))
