
export const respondTo = (genObj,method) => ( typeof genObj[method] === "function" ) && true || false 
const hasGetMethod = genObj => ( typeof genObj.get === "function" ) && true || false 

/**
 * Class that represent certificate subject
 */
const CertificateSubject = class {
    /**
     * Common Name
     * @Type {string}
     */
    #commonName
    /**
     * Country Name
     * @Type {string}
     */
    #countryName
    /**
     * State or Province Name
     * @Type {string}
     */
    #stateOrProvinceName
    /**
     * Locality Name
     * @Type {string}
     */
    #localityName
    /**
     * Organization Name
     * @Type {string}
     */
    #organizationName
    /**
     * Organizational Unit Name
     * @Type {string}
     */
    #organizationalUnitName
    /**
     * Email Address
     * @Type {string}
     */
    #emailAddress

    /**
     * Array of [propery, alias]
     * @Type {Array.<Array>} array of attibutes name and their alias
     */
    #attributes = [
        { attribute: "commonName", alias: "CN" },
        { attribute: "countryName", alias: "C" },
        { attribute: "stateOrProvinceName",alias: "S"},
        { attribute: "localityName",alias: "L"},
        { attribute: "organizationName",alias: "O"},
        { attribute: "organizationalUnitName",alias: "OU"},
        { attribute: "emailAddress", alias: "E" }
    ]

    constructor(input){
        const self = this
        if ( input ){

            if ( typeof input === "string" ){

                input.split("/").forEach(token => {
                    if ( token ){
                        const [attribute,value] = token.split("=")
                        if ( this.#isAttributeAlias(attribute) ) {
                            const isFunction = typeof self[`set${attribute.toUpperCase()}`] === "function"
                            if ( isFunction ) self[`set${attribute.toUpperCase()}`](value)
                            else throw new Error(`unsupported alias [${attribute}]`)
                        }
                        else {
                            const isFunction = typeof self[`set${self.#capitalizeFirstLetter(attribute)}`] === "function"
                            if ( isFunction ) self[`set${self.#capitalizeFirstLetter(attribute)}`](value)
                            else throw new Error(`unsupported attribute [${attribute}]`)
                        }
                    }
                })
            }
            else {
                const inputRespondToGet = respondTo(input,"get")

                this.#attributes.forEach( _attribute =>{
                    const { attribute,alias } = _attribute

                    let attributeValue, aliasValue, attributeMethod, isAttributeMethod, aliasMethod, isAliasMethod
                    if ( inputRespondToGet ) {
                        try { 
                            attributeValue = input.get(attribute)
                            if ( attributeValue ){
                                attributeMethod = `set${this.#capitalizeFirstLetter(attribute)}`
                                isAttributeMethod = typeof this[attributeMethod] === "function"
                            }
                        } catch ( e ){ attributeValue = null, attributeMethod = null, isAttributeMethod = false  }

                        try { 
                            aliasValue = input.get(alias)
                            if ( aliasValue ){
                                aliasMethod = `set${alias.toUpperCase()}`
                                isAliasMethod = typeof this[aliasMethod] === "function"
                            }
                        } 
                        catch ( e ){ aliasValue = null, aliasMethod = null, isAliasMethod = false }
                    }
                    else {
                        attributeValue = input[attribute]
                        if ( attributeValue ){
                            attributeMethod = `set${this.#capitalizeFirstLetter(attribute)}`
                            isAttributeMethod = typeof this[attributeMethod] === "function"
                        }

                        aliasValue = input[alias]
                        if ( aliasValue ){
                            aliasMethod = `set${alias.toUpperCase()}`
                            isAliasMethod = typeof this[aliasMethod] === "function"
                        }
                    }

                    if ( isAttributeMethod ) {
                        this[attributeMethod](attributeValue)
                    }

                    if ( isAliasMethod ) { 
                        this[aliasMethod](aliasValue)
                    }
                })
            }
        }
    }

    #isAttributeAlias(attribute) {
        return attribute.length > 0 && attribute.length < 3
    }

    #capitalizeFirstLetter(string) {
        return string[0].toUpperCase() + string.slice(1);
    }

    asFogeInput() {
        return this.#attributes.reduce(
            (list,attr) => {
                const value = this[attr.attribute]()

                if ( value ){
                    list.push({
                        name: attr.attribute,
                        value: value
                    })
                }
                
                return list
            },[]
        )
    }

    /**
     * Set the Common Name
     * @param {string} commonName Common Name
     * @returns {CertificateSubject}
     */
    setCommonName(commonName) {
        this.#commonName = commonName
        return this
    }

    /**
     * Alias method of setCommonName
     * @param {string} commonName 
     * @returns {CertificateSubject}
     */
    setCN(commonName) {
        this.setCommonName(commonName)
        return this
    }

    /**
     * Get the Common Name
     * @returns {string}
     */
    commonName() {
        return this.#commonName
    }

    /**
     * Alias method of commonName()
     * @returns {string}
     */
    CN() {
        return this.commonName()
    }

    setCountryName(countryName) {
        this.#countryName = countryName
        return this
    }

    setC(countryName) {
        this.setCountryName(countryName)
        return this
    }

    countryName() {
        return this.#countryName
    }

    C() {
        return this.countryName()
    }

    setStateOrProvinceName(stateOrProvinceName) {
        this.#stateOrProvinceName = stateOrProvinceName
        return this
    }

    setST(stateOrProvinceName) {
        this.setStateOrProvinceName(stateOrProvinceName)
        return this
    }

    stateOrProvinceName() {
        return this.#stateOrProvinceName
    }

    ST() {
        return this.stateOrProvinceName()
    }

    setLocalityName(localityName) {
        this.#localityName = localityName
        return this
    }

    setL(localityName) {
        this.setLocalityName(localityName)
        return this
    }

    localityName() {
        return this.#localityName
    }

    L() {
        return this.localityName()
    }

    setOrganizationName(organizationName) {
        this.#organizationName = organizationName
        return this
    }

    setO(organizationName){
        this.setOrganizationName(organizationName)
        return this
    }

    organizationName() {
        return this.#organizationName
    }

    O() {
        return this.organizationName()
    }

    setOrganizationalUnitName(organizationalUnitName) {
        this.#organizationalUnitName = organizationalUnitName
        return this
    }

    setOU(organizationalUnitName){
        this.setOrganizationalUnitName(organizationalUnitName)
        return this
    }

    organizationalUnitName() {
        return this.#organizationalUnitName
    }

    OU(){
        return this.organizationalUnitName()
    }

    setEmailAddress(emailAddress) {
        this.#emailAddress = emailAddress
        return this
    }

    setE(emailAddress){
        this.setEmailAddress(emailAddress)
        return this
    }

    emailAddress() {
        return this.#emailAddress
    }

    E() {
        return this.emailAddress()
    }
}

const CertificateIssuer = CertificateSubject

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



export { CertificateSubject, CertificateIssuer }