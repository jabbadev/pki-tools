
const hasGetMethod = genObj => ( typeof genObj.get === "function" ) && true || false 

/**
 * @class 
 * @classdesc  CertificateAttributes is an object that rappresent the
 * certificate attributes info CN,UO,S ecc.
 * @constructor
 * */
export const CertificateAttributes = function(dataObject) {
    /**
     * @private
     * @property
     */
    this._data = {}

    if ( dataObject ){
        const hasGet = hasGetMethod(dataObject)
        this.properties.forEach(props=>{
            const [propName,alias] = props
            
            let propValue = null
            try { propValue = ( hasGet ) && dataObject.get(propName) || dataObject[propName] }
            catch( e ){
                console.warn("warning: get method raise exception")
            }
            propValue && this[propName]( propValue)
            
            try { propValue = ( hasGet && alias ) && dataObject.get(alias) || dataObject[alias] }
            catch( e ){
                console.warn("warning: get method raise exception")
            }
            propValue && this[alias]( propValue)
        })
    }
}
CertificateAttributes.prototype = {
    /**
    * @description list of available getter and setter method with theirs aliases
    */
    properties: [["commonName","CN"],
                ["countryName","C"],
                ["stateOrProvinceName","S"],
                ["localityName","L"],
                ["organizationName","O"],
                ["organizationalUnitName","OU"],
                ["emailAddress",null]],
    
    commonName: function(){},
    CN: function(){},
    countryName: function(){},
    UO: function(){},
    stateOrProvinceName: function(){},
    S: function(){},
    localityName: function(){},
    L: function(){},
    organizationName: function(){},
    O: function(){},
    organizationalUnitName: function(){},
    OU: function(){},
    emailAddress: function(){},
    asFogeInput: function(){
        return Object.entries(this._data).reduce(
            (list,attr) =>( list.push({
                                    name: attr[0],
                                    value: attr[1]
                                }), list ),[])
    }
}
CertificateAttributes.prototype.properties.forEach((props)=>{
    const [propName,alias] = props,
    getterSetterFunction = `
    if ( value ){
        this._data['${propName}'] = value
        return this 
    } 
    return this._data['${propName}']
    `.trim()

    CertificateAttributes.prototype[propName] = new Function("value",getterSetterFunction)
    if ( alias ){
        CertificateAttributes.prototype[alias] = new Function("value",getterSetterFunction)
    }
})


export const CsrAttributes = function(dataObject) {
    /**
     * @private
     * @property
     */
    this._data = {}

    if ( dataObject ){
        const hasGet = hasGetMethod(dataObject)
        this.properties.forEach(prop=>{
            
            let propValue = null
            try { propValue = ( hasGet ) && dataObject.get(propName) || dataObject[propName] }
            catch( e ){
                console.warn("get method raise exception")
            }
            propValue && this[propName]( propValue)
        })
    }
}
CsrAttributes.prototype = {
    /**
    * @description list of available getter and setter method with theirs aliases
    */
    properties: ["challengePassword","unstructuredName"],
    
    challengePassword: function(){},
    unstructuredName: function(){},
    asFogeInput: function(){
        return Object.entries(this._data).reduce(
            (list,attr) =>( list.push({
                                    name: attr[0],
                                    value: attr[1]
                                }), list ),[])
    }
}
CsrAttributes.prototype.properties.forEach( propName => {
    const getterSetterFunction = `
    if ( value ){
        this._data['${propName}'] = value
        return this 
    } 
    return this._data['${propName}']
    `.trim()

    CsrAttributes.prototype[propName] = new Function("value",getterSetterFunction)
})
