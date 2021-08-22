const rewire = require("rewire")
const cancel = rewire("./cancel")
const rstring = cancel.__get__("rstring")
// @ponicode
describe("rstring", () => {
    test("0", () => {
        let callFunction = () => {
            rstring()
        }
    
        expect(callFunction).not.toThrow()
    })
})
