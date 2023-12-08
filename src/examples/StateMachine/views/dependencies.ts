export class Dependencies {
    static state = `(ret) => { 
        // scope contains: data, node, view, constants, state
        // ** preparations and default behaviour here ** //
        console.log('inside ud default func pre', {ret:{...ret}, data, node, view})
        ret.data = data
        ret.node = node
        ret.view = view
        console.log('inside ud default func post', {ret:{...ret}, data, node, view})
        // data, node, view are dependencies by default. delete them above if you want to remove them.
        // add preparation code here (like for loops to count something), then list the dependencies below.
      
        // ** declarations here ** //
        ret.features = data.features
    }`;
    static command = `(ret) => { 
        // scope contains: data, node, view, constants, state
        // ** preparations and default behaviour here ** //
        console.log('inside ud default func pre', {ret:{...ret}, data, node, view})
        ret.data = data
        ret.node = node
        ret.view = view
        console.log('inside ud default func post', {ret:{...ret}, data, node, view})
        // data, node, view are dependencies by default. delete them above if you want to remove them.
        // add preparation code here (like for loops to count something), then list the dependencies below.
      
        // ** declarations here ** //
        ret.name = data.$name.value
    }`;
    static event = `(ret) => { 
        // scope contains: data, node, view, constants, state
        // ** preparations and default behaviour here ** //
        console.log('inside ud default func pre', {ret:{...ret}, data, node, view})
        ret.data = data
        ret.node = node
        ret.view = view
        console.log('inside ud default func post', {ret:{...ret}, data, node, view})
        // data, node, view are dependencies by default. delete them above if you want to remove them.
        // add preparation code here (like for loops to count something), then list the dependencies below.
      
        // ** declarations here ** //
        ret.name = data.$name.value
    }`;
}
