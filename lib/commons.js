/**
 * @class 
 * @classdesc  Subject is an object that rappresent the
 * certificate subject info CN,UO,S ecc.
 * @constructor
 * */
export const Subject = function() {
    /**
     * @private
     * @property
     */
    this._data = {}
}
Subject.prototype = {
    /**
    * @description list of available getter and setter method with theirs aliases
    */
    properties: [["commonName","CN"],
                ["countryName","UO"],
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
Subject.prototype.properties.forEach((props)=>{
    const [propName,alias] = props,
    getterSetterFunction = `
    if ( value ){
        this._data['${propName}'] = value
        return this 
    } 
    return this._data['${propName}']
    `.trim()

    Subject.prototype[propName] = new Function("value",getterSetterFunction)
    if ( alias ){
        Subject.prototype[alias] = new Function("value",getterSetterFunction)
    }
})