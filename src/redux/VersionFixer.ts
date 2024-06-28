import {Dictionary, DocString, DState, Log} from "../joiner";
import { U } from "../joiner";


export class VersionFixer {
    private static versionAdapters: Dictionary<number/*version*/, {n: number, f:(s: DState)=>DState}>;
    private static highestVersion: number;


    private static setup(){
        VersionFixer.versionAdapters = {};
        const errormsg = (k: string)=>"Version auto-updater have a updater registered incorrectly: \"" + k + "\", please notify the developers."
        for (let k in VersionFixer){
            switch(k){
                case 'highestVersion': case 'versionAdapters':
                case 'setup': case 'update': break;
            }
            let [froms, tos] = k.split(' -> ');
            Log.exDev(!froms.length || !tos.length, errormsg(k));
            let from = +froms; let to = +tos;
            Log.exDev(isNaN(from) || isNaN(to), errormsg(k));
            Log.exDev(!!VersionFixer.versionAdapters[from], "duplicate version adapter from \""+from+"\", please notify the developers.")
            VersionFixer.highestVersion = Math.max(VersionFixer.highestVersion, to);
            VersionFixer.versionAdapters[from] = {n:to, f: (VersionFixer as any)[k]}

        }
    }
    public static update(s: DState): DState{
        if (!VersionFixer.versionAdapters) VersionFixer.setup();
        let prevVer = s.version?.n || 0;
        let currVer = prevVer;
        while(currVer !== VersionFixer.highestVersion) {
            Log.exDev(!VersionFixer.versionAdapters[currVer], "missing version adapter from \""+ currVer+"\", please notify the developers.");
            let {n, f} = VersionFixer.versionAdapters[currVer];
            s = f(s);
            currVer = s.version?.n || 0;
            Log.exDev(currVer !== n, "version updater updated to incorrect target versionn \""+prevVer+"\" -> \""+n+"\" , please notify the developers.");
            Log.exDev(currVer <= prevVer, "version updater found loop at version \""+currVer+"\", please notify the developers.");
            prevVer = currVer;
        }
        return s;
    }


    private ['0 -> 2.1'](s: DState): DState {
        s.version = {n: 2.1, date:"_reconverted", conversionList:[0]};
        return s;
    }
    private ['2.1 -> 2.3'](s: DState): DState {
        s.version.conversionList = [...s.version.conversionList, s.version.n];
        s.version.n = 2.2;

        return s;
    }
}
