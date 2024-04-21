import {
    DV,
    DModel,
    DViewElement,
    DViewPoint,
    Pointer,
    DPackage,
    packageDefaultSize,
    DClass,
    DEnumerator, DAttribute, DReference, DOperation, DEnumLiteral, DObject, DValue, DParameter
} from '../../joiner';

class DefaultViews {
    static model(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Model', DV.modelView(), undefined, '', '', '', [DModel.cname],
            '', 1, false, true, vp);
        view.draggable = false; view.resizable = false;
        view.oclCondition = 'context DModel inv: true';
        view.palette = {'background-': ['#ffffff']};
        view.css = '.root {background-color: var(--background-1);}\n';
        view.css += '.edges {z-index: 101; position: absolute; height: 0; width: 0; overflow: visible;}';
        view.usageDeclarations = '(ret) => {\n' +
            '// ** preparations and default behaviour here ** //\n' +
            'ret.node = node\n' +
            'ret.view = view\n' +
            '// custom preparations:\n' +
            'let packages = data && data.isMetamodel ? data.packages : [];\n' +
            'let suggestedEdges = data?.suggestedEdges || {};\n' +
            '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
            '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
            '// ** declarations here ** //\n' +
            'ret.firstPackage = packages[0]\n'+
            'ret.otherPackages = packages.slice(1)\n'+
            'ret.m1Objects = data && !data.isMetamodel ? data.allSubObjects : []\n'+
            'ret.refEdges = (suggestedEdges.reference || []).filter(e => !e.vertexOverlaps)\n'+
            'ret.extendEdges = (suggestedEdges.extend || []).filter(e => !e.vertexOverlaps)\n'+
        '}';
        return view;
    }

    static package(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Package', DV.packageView(), undefined, '', '', '', [DPackage.cname], '', 1, false, true, vp);
        view.defaultVSize = packageDefaultSize;
        view.oclCondition = 'context DPackage inv: true';
        view.palette = {'color-': ['#028012'], 'background-': ['#ffffff']};
        view.css = '.package {background-color: var(--background-0); border-radius: 0.2em; border-left: 0.25em solid var(--color-1);}\n';
        view.css += '.package-children {height: -webkit-fill-available; width: -webkit-fill-available;}';
        return view
    }

    static class(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Class', DV.classView(), undefined, '', '', '', [DClass.cname], '', 1, false, true, vp);
        view.adaptWidth = true; view.adaptHeight = true;
        view.oclCondition = 'context DClass inv: true';
        view.palette = {'color-': ['#ff0000', '#000000', '#ffffff'], 'background-': ['#ffffff', '#eeeeee', '#ff0000']};
        view.css = '.class {border-radius: 0.2em; border-left: 0.25em solid var(--color-1); background: var(--background-1); color:var(--color-2);}\n';
        view.css += '.class-name {font-weight: bold; color: var(--color-1);}\n';
        view.css += '.class-children {background-color: var(--background-2); height: fit-content; width: -webkit-fill-available;}';
        return view;
    }

    static enum(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Enum', DV.enumeratorView(), undefined, '', '', '', [DEnumerator.cname], '', 1, false, true, vp);
        view.adaptWidth = true; view.adaptHeight = true;
        view.oclCondition = 'context DEnumerator inv: true';
        view.palette = {'color-': ['#ffa500', '#000000', '#ffffff'], 'background-': ['#ffffff', '#eeeeee', '#ff0000']};
        view.css = '.enumerator {border-radius: 0.2em; border-left: 0.25em solid var(--color-1); background: var(--background-1); color: var(--color-2);}\n';
        view.css += '.enumerator-name {font-weight: bold; color: var(--color-1);}\n';
        view.css += '.enumerator-children {background-color: var(--background-2); height: fit-content; width: -webkit-fill-available;}';
        return view;
    }
    static attribute(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Attribute', DV.attributeView(), undefined, '', '', '', [DAttribute.cname], '', 1, false, true, vp);
        view.oclCondition = 'context DAttribute inv: true';
        view.palette = {};
        return view;
    }

    static reference(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Reference', DV.referenceView(), undefined, '', '', '', [DReference.cname], '', 1, false, true, vp);
        view.oclCondition = 'context DReference inv: true';
        view.palette = {};
        return view;
    }

    static operation(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Operation', DV.operationView(), undefined, '', '', '', [DOperation.cname], '', 1, false, true, vp);
        view.oclCondition = 'context DOperation inv: true';
        view.palette = {};
        return view;
    }

    static parameter(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Parameter', DV.parameterView(), undefined, '', '', '', [DParameter.cname],
            '', 1, false, true, vp);
        view.palette = {};
        view.css = '*{\n\tfontSize:0.8rem;\n}'
        return view;
    }

    static literal(vp: Pointer<DViewPoint>): DViewElement {
        const view: DViewElement = DViewElement.new('Literal', DV.literalView(), undefined, '', '', '', [DEnumLiteral.cname], '', 1, false, true, vp);
        view.oclCondition = 'context DEnumLiteral inv: true';
        view.palette = {};
        return view
    }

    static object(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Object', DV.objectView(), undefined, '', '', '', [DObject.cname], '', 1, false, true, vp);
        view.adaptWidth = true; view.adaptHeight = true;
        view.oclCondition = 'context DObject inv: true';
        view.palette = {'color-': ['#ff0000', '#000000', '#ffffff'], 'background-': ['#ffffff', '#eeeeee', '#ff0000']};
        view.css = '.object {border-radius: 0.2em; border-left: 0.25em solid var(--color-1); background: var(--background-1); color: var(--color-2);}\n';
        view.css += '.object-name {font-weight: bold; color: var(--color-1);}\n';
        view.css += '.object-children {background-color: var(--background-2); height: fit-content; width: -webkit-fill-available;}';
        view.usageDeclarations = '(ret) => {\n' +
            '// ** preparations and default behaviour here ** //\n' +
            'ret.data = data\n' +
            'ret.node = node\n' +
            'ret.view = view\n' +
            '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
            '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
            '// ** declarations here ** //\n' +
            'ret.metaclassName = data.instanceof?.name || \'Object\'\n' +
            'ret.features = data.features\n' +
        '}';
        return view;
    }

    static value(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Value', DV.valueView(), undefined, '', '', '', [DValue.cname], '', 1, false, true, vp);
        view.oclCondition = 'context DValue inv: true';
        view.palette = {};
        view.css = '.value {padding-right: 6px}'
        view.usageDeclarations = '(ret) =>  {\n' +
            '// ** preparations and default behaviour here ** //\n' +
            'ret.node = node\n' +
            'ret.view = view\n' +
            '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
            '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
            '// ** declarations here ** //\n' +
            'ret.instanceofname = data.instanceof?.name\n' +
            'ret.valuesString = data.valuesString()\n' +
            'ret.typeString = data.typeString\n' +
        '}';
        return view;
    }
}

export default DefaultViews;
