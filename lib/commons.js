export const respondTo = (genObj,method) => ( typeof genObj[method] === "function" ) && true || false 
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
        const hasGet = respondTo(dataObject,"get")
        this.properties.forEach(props=>{
            const [propName,alias] = props
            
            let propValue
            try { propValue = ( hasGet ) && dataObject.get(propName) || dataObject[propName] }
            catch( e ){ propValue = null }
            propValue && this[propName]( propValue)
            
            try { propValue = ( hasGet && alias ) && dataObject.get(alias) || dataObject[alias] }
            catch( e ){ propValue = null }
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
        this.properties.forEach(propName=>{         
            let propValue
            try { propValue = ( hasGet ) && dataObject.get(propName) || dataObject[propName] }
            catch( e ){ propValue = null }
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

export const CertificateInput = function(dataObject){
    this._data = {}

    if ( dataObject ){
        const hasGet = respondTo(dataObject,"get")
        this.properties.forEach(propName=>{         
            let propValue
            try { propValue = ( hasGet ) && dataObject.get(propName) || dataObject[propName] }
            catch( e ){ propValue = null }
            propValue && this[propName]( propValue)
        })
    }
}
CertificateInput.prototype = {
    properties: ["subject","issuer","extensions","validityYears","serialNumber","privateKey","publicKey","privateKeyPasswd"],

    subject: function(){},
    issuer: function(){},
    extensions: function(){},
    validityYears: function(){},
    serialNumber: function(){},
    privateKey: function(){},
    publicKey: function(){},
    privateKeyPasswd: function(){},

    options: function(){ return this._data }
}
CertificateInput.prototype.properties.forEach( propName => {
    const getterSetterFunction = `
    if ( value ){
        this._data['${propName}'] = value
        return this 
    } 
    return this._data['${propName}']
    `.trim()

    CertificateInput.prototype[propName] = new Function("value",getterSetterFunction)
})

const verifyCertificateInput = ( input ) => {
    if ( !input.validityYears ) throw Error("Certificate input must have a valid [validityYears] number")
    if ( !input.serialNumber ) throw Error("Certificate input must have a valid [serialNumber] string")

    if ( typeof input.validityYears != "number" ) throw Error("validityYears must be a number")
    if ( typeof input.serialNumber != "string" ) throw Error("serialNumber must be a string")

    return input
}

export const certificateInputHandler = ( ...input ) => {
    const props = [ "subject", "issuer", "extensions", "validityYears", "serialNumber", "privateKey", "publicKey", "privateKeyPasswd" ]
    let certificateInput = {}
    if ( input.length == 1 ){
        const certIn = input[0]
        if ( respondTo(certIn,"options") ){
            certificateInput = certIn.options()
        }
        else if ( respondTo(certIn,"get") ){
            props.forEach((propName)=>{
                const value = certIn.get(propName)
                if (value) certificateInput[propName] = value
            })
        }
        else if ( certIn instanceof Object ){
            props.forEach(prop => {
                const value = certIn[prop]
                if ( value ){
                    certificateInput[prop] = value
                }
            })
        }
    }
    else {
        props.forEach((propName,i)=>{
            if (input[i]) certificateInput[propName] = input[i]
        })
    }

    return verifyCertificateInput(certificateInput)
}