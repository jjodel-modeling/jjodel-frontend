import {
    Dictionary, DUser,
    EcoreParser, GObject, IStore,
    Json,
    LModel,
    LoadAction,
    Log, U,
    LPointerTargetable, prjson2xml, prxml2json,
    store, RuntimeAccessible, DModelElement
} from '../../joiner';

@RuntimeAccessible
export class SaveManager {
    private static tmpsave: IStore;
    static save(){ SaveManager.tmpsave = store.getState(); localStorage.setItem("tmpsave", JSON.stringify(SaveManager.tmpsave)); }
    static load(fullstatestr?: string): void {
        if (!fullstatestr && SaveManager.tmpsave) { LoadAction.new(SaveManager.tmpsave); return; }
        fullstatestr = fullstatestr || localStorage.getItem("tmpsave") || 'null'; // priorities: 1) argument from file 2) state variable cached 3) localstorage 4) null prevent crash
        SaveManager.tmpsave = JSON.parse(fullstatestr);
        LoadAction.new(SaveManager.tmpsave);
        // SetRootFieldAction.new('metamodel', dMetaModel.id, '', true); already set by loadaction in batch
    }

    public static exportEcore_click(toXML: boolean = false, toFile: boolean = true): void { // e: React.MouseEvent,
        let lmodel: LModel = (LPointerTargetable.wrap(store.getState().models[0]) as LModel)
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
        U.download((lmodel.name || ((lmodel as any).isMetaModel ? 'M2' : 'M1') + '_unnamed')  + (toXML ? ".xml.ecore" : '.json.ecore'), str);
    }

    public static importEcore_click(fromXML: boolean = false, fromfile: boolean = true): void {
        const extension = ".ecore"; // Selectors.getActiveModel().isM1() ? '.' + Selectors.getActiveModel().metamodel.fullname() : '.ecore';
        let filestring: string, jsonstring: string;
        console.log("importEcore: prefromfile");
        if (!fromfile) {
            filestring = localStorage.getItem("import") || 'null';
            if (fromXML) {
                const xmlDoc = new DOMParser().parseFromString(filestring,"text/xml");
                filestring = prxml2json.xml2json(xmlDoc, '\t');
            }
            SaveManager.importEcore(filestring);
            return; }

        console.log("importEcore: pre file read");
        U.fileRead((e: Event, files?: FileList | null, fileContents?: string[]) => {
            Log.ex(!fileContents || !files || fileContents.length !== files.length, 'Failed to get file contents:', files, fileContents);
            Log.ex(fileContents && fileContents.length > 1, 'Should not be possible to input multiple files.');
            if (!fileContents) return;
            if (fileContents.length == 0) return;
            filestring = fileContents[0];
            console.log('importEcore filestring input: ', filestring);
            if (fromXML) {
                const xmlDoc = new DOMParser().parseFromString(filestring,"text/xml");
                console.log('importEcore xml:', xmlDoc);
                jsonstring = prxml2json.xml2json(xmlDoc, '\t');
                console.log('importEcore jsonstr input: ', jsonstring);
            }
            else jsonstring = filestring;
            SaveManager.importEcore(jsonstring || 'null');
        }, [extension], true);
    }

    public static exportEcore(model: LModel): Json { let loopobj = {}; try { return model.generateEcoreJson(loopobj); } catch(e) { Log.exx("loop in model:", loopobj); } return {"eror": true, loopobj}; }
    public static importEcore(jsonstr: string | null, loadOnModel: boolean = true): DModelElement[] {
        return EcoreParser.parse(jsonstr, loadOnModel);
    }
}

