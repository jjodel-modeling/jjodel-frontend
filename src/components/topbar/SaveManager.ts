import {
    Dictionary, DUser,
    EcoreParser, GObject, DState,
    Json,
    LModel,
    LoadAction,
    Log, U,
    LPointerTargetable, prjson2xml, prxml2json,
    store, RuntimeAccessible, DModelElement, SetRootFieldAction, Selectors
} from '../../joiner';

@RuntimeAccessible
export class SaveManager {
    public static cname: string = "SaveManager";
    private static tmpsave: DState;

    static save(): void {
        SaveManager.tmpsave = store.getState();
        localStorage.setItem("tmpsave", JSON.stringify(SaveManager.tmpsave));
    }

    static load(fullstatestr?: string): void {
        if (!fullstatestr && SaveManager.tmpsave) { LoadAction.new(SaveManager.tmpsave); return; }
        fullstatestr = fullstatestr || localStorage.getItem("tmpsave") || 'null'; // priorities: 1) argument from file 2) state variable cached 3) localstorage 4) null prevent crash
        SaveManager.tmpsave = JSON.parse(fullstatestr);
        LoadAction.new(SaveManager.tmpsave);
        // SetRootFieldAction.new('metamodel', Selectors.getActiveModel()?.id, '', true); already set by loadaction in batch
    }

    public static exportEcore_click(toXML: boolean = false, toFile: boolean = true): void { // e: React.MouseEvent,
        let lmodel: null|LModel = Selectors.getActiveModel();
        if (!lmodel) return;
        let json = SaveManager.exportEcore(lmodel);
        let str = JSON.stringify(json, null, "\t");
        if (toXML) {
            str = prjson2xml.json2xml(json, '\t');
            str = U.formatXml(str);
        }

        if (!toFile) {
            // (document.querySelector("#export-tmp") as any).innerText = str;
            localStorage.setItem("import", str);
            return;
        }
        let ism2 = (lmodel as LModel).isMetamodel;
        let name = (lmodel.name || (ism2 ? 'M2' : 'M1') + '_unnamed')  + (toXML ? ".xml" : '.json') + "."+ (ism2 ? "ecore" : lmodel.instanceof?.name || "shapeless");
        console.log("download file:", {name, ism2, toXML, lmodel, instanceof:lmodel.instanceof});
        U.download(name, str);
    }

    public static importEcore_click(fromXML: boolean = false, fromfile: boolean = true): void {
        try { this.importEcore_click0(fromXML, fromfile); } catch (e: any) {
            let str = e?.message?.substring?.(0, 1000) || 'some error';
            console.trace(str, e);
            // throw new Error(str);
        }
    }
    public static importEcore_click0(fromXML: boolean = false, fromfile: boolean = true): void {
        const extensions: string[] = [(fromXML ? "*.xml.*" : "*.json.*")]; // [".ecore"]; // Selectors.getActiveModel().isM1() ? '.' + Selectors.getActiveModel().metamodel.fullname() : '.ecore';
        let filestring: string, jsonstring: string, jsonobj: GObject = undefined as any;
        console.log("importEcore: prefromfile");
        if (!fromfile) {
            filestring = localStorage.getItem("import") || 'null';
            if (fromXML) {
                const xmlDoc = new DOMParser().parseFromString(filestring,"text/xml");
                jsonobj = prxml2json.xml2jsonobj(xmlDoc, ' ');
            }
            //if (filestring.includes("\n")) throw new Error(filestring.substring(0, 1000));
            SaveManager.importEcore(jsonobj || filestring, true, undefined, true); // todo: trova il modo di determinare se è m1 o m2 senza filename
            return; }

        console.log("importEcore: pre file read");
        let filename;
        U.fileRead((e: Event, files?: FileList | null, fileContents?: string[]) => {
            Log.ex(!fileContents || !files || fileContents.length !== files.length, 'Failed to get file contents:', files, fileContents);
            Log.ex(fileContents && fileContents.length > 1, 'Should not be possible to input multiple files yet.');
            if (!fileContents) return;
            if (fileContents.length == 0) return;
            // @ts-ignore
            filename = e.target.files?.[0].name;
            console.log("file read", {e, fileContents, files, filename});
            filestring = fileContents[0];
            console.log('importEcore filestring input: ', filestring);
            if (fromXML) {
                let windoww = window as any;
                windoww.file = filestring;
                windoww.todoc = (str: any) => new DOMParser().parseFromString(str,"text/xml");
                windoww.doctojson = (doc: any) => prxml2json.xml2jsonobj(doc, ' ');
                // problemi doctojson or xmi parser: \n replacemet causa crash per stringa in posizione invalida. \" anche per attributi inline che iniiano con \\"
                // filestring = U.multiReplaceAll(filestring, ["\t", "\r", "\n", '&amp;', '&#38;', '&quot;', '&', '\'', '"'], ["\\t", "\\r", "\\n", '\\&', "\\'", '\\"', '\\&', "\\'", '\\"']);//,  "\\t"), "\r", "\\r"), "\n", "\\n");

                const xmlDoc = new DOMParser().parseFromString(filestring,"text/xml");
                console.log('importEcore xml:', xmlDoc);
                let jsonstring0 = '';
                jsonobj = prxml2json.xml2jsonobj(xmlDoc, ' ');//doto: non devo wrappare con \" i nomi di chiavi o valori ma solo i contenuti
                /*jsonstring = jsonstring0;
                //jsonstring = U.multiReplaceAll(jsonstring0, ["\t", "\r", "\n", '&amp;', '&#38;', '&quot;', '&', '\'', '"'], ["\\t", "\\r", "\\n", '\\&', "\\'", '\\"', '\\&', "\\'", '\\"']);//,  "\\t"), "\r", "\\r"), "\n", "\\n");
                *///jsonstring = jsonstring.replaceAll(/(\{|\,)\\n\s*/gm, "")
                /*if (jsonstring.includes("\n")) throw new Error(jsonstring0.substring(0, 1000)+"\n\n\n\n" + jsonstring.substring(0, 1000));
                */
                // jsonstring = JSON.stringify(jsonobj);
                console.log('importEcore jsonstr input: ', jsonobj);
            }
            else jsonstring = filestring;
            let isMetamodel = filename.indexOf(".ecore") === filename.length - ".ecore".length;
            console.log("ismetamodel", {filename, isMetamodel});
            let end = SaveManager.importEcore(jsonobj || jsonstring || 'null', isMetamodel,filename, true);
            console.error({end});
        }, extensions, true);
    }

    public static exportEcore(model: LModel): Json {
        let loopobj = {};
        try { return model.generateEcoreJson(loopobj); }
        catch(e) { Log.exx("possible loop in model:\t\n" + (e as Error).message, {loopobj, e}); }
        return {"error": true, loopobj};
    }
    public static importEcore(jsonstr: GObject | string | null, isMetamodel: boolean, filename: string | undefined, loadOnModel: boolean = true): DModelElement[] {
        return EcoreParser.parse(jsonstr, isMetamodel, filename, loadOnModel);
    }

    static exportLayout_click(toFile: boolean) {
        let lmodel: LModel = (LPointerTargetable.wrap(store.getState().models[0]) as LModel);
        // lmodel.node?.allSubNodes

    }
    static importLayout_click(fromFile: boolean) {

    }
}

