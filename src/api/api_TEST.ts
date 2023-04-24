import axios, {AxiosResponse} from 'axios';
export class AxiosResponseType{}
export class WeatherResponse extends AxiosResponseType{
}
function doRequest(url: string,
                   callbackSuccess: (response: AxiosResponse<AxiosResponseType>) => any,
                   callbackError: (error: any) => any): Promise<AxiosResponse<AxiosResponseType>> {
    console.log('api call:', url);
    return axios
        .get(url)
        .then(callbackSuccess)
        .catch(callbackError);
}

/////// url generator functions
const URL_WeatherForecast = (coord: {lat:number, lng: number}, days: number) => "https://api.urltodo.com/v/2.5/forecast?"
    + "lat=" + coord.lat + "&lon=" + coord.lng;

export const URL = {WeatherForecast: URL_WeatherForecast};

/////// parametrized api caller functions
function weatherForecast(coord: {lat:number, lng: number},
                                days: number,
                                successCallback: (response: AxiosResponse<WeatherResponse>) => void, failureCallback: (error: unknown) => void): void {
    console.log("__meteo api FORECAST_REQUEST", coord, days);
    doRequest(URL.WeatherForecast(coord, days), successCallback, failureCallback);
}

export const API = {WeatherForecast: weatherForecast};

/*
graph -> only for models.
vertex -> package, class, [features]
field -> features, [class], [model]

vertex can have fields and subvertex (but not subgraphs?)
field can have subfields but not subvertex!

vertice, field.
    <Vertex data={m2classobject} viewpoint={currentvp} />
nello stile determinato dalla coppia m2classObject e currentvp,
    ci sono in jsx altri this.childrens.map(c=><vertex data= {c} .../>)

magari anche da altri modelli
*/
