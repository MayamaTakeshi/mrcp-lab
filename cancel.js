const sip = require('sip')
const mrcp = require('mrcp')
const mrcp_utils = require('mrcp-utils')
const uuid = require('uuid')

const server_sip_host = '127.0.0.1'
const server_sip_port = 8070 

const resource_type = 'speechsynth'

const call_id = uuid.v4()

args = {
    language: 'dtmf',
    voice: 'dtmf',
    text: '1234'
}

var local_ip = '192.168.0.109'
var local_sip_port = 9900
var local_rtp_port = 9902

var rstring = () => {
    return Math.floor(Math.random()*1e6).toString()
};

const sip_stack = sip.create({
        address: local_ip,
        port: local_sip_port,
    },
    (req) => {
        if(req.method == 'BYE') {
            var res = sip.makeResponse(req, 200, 'OK')
            sip_stack.send(res)
            console.log('Got BYE')
            setTimeout(() => {
                process.exit(0)
            }, 1000)
        }

        sip_stack.send(sip.makeResponse(req, 405, "Method not allowed"))
    }
)

const sip_uri = `sip:${server_sip_host}:${server_sip_port}`

sip_stack.send(
	{
		method: 'INVITE',
		uri: sip_uri,
		headers: {
			to: {uri: sip_uri},
			from: {uri: `sip:mrcp_client@${local_ip}:${local_sip_port}`, params: {tag: rstring()}},
			'call-id': call_id,
			cseq: {method: 'INVITE', seq: Math.floor(Math.random() * 1e5)},
			'content-type': 'application/sdp',
			contact: [{uri: `sip:mrcp_client@${local_ip}:${local_sip_port}`}],
		},
		content: mrcp_utils.gen_offer_sdp(resource_type, local_ip, local_rtp_port),
	},
	function(rs) {
		console.log(rs)

		if(rs.status >= 300) {
			console.log('call failed with status ' + rs.status)
		}
		else if(rs.status < 200) {
			console.log('call progress status ' + rs.status)

            setTimeout(() => {
                    console.log("sending CANCEL")
                    console.dir(rs.headers)
                    sip_stack.send({
                        method: 'CANCEL',
                        uri: sip_uri,
                        headers: {
                            to: rs.headers.to,
                            from: rs.headers.from,
                            'call-id': call_id,
                            cseq: {method: 'CANCEL', seq: rs.headers.cseq.seq},
                            via: rs.headers['via']
                        }
                    }, (res) => {
                            console.log(`CANCEL got: ${res.status} ${res.reason}`)	
                            setTimeout(() => {
                                console.log('Success. Terminating')
                                process.exit(0)
                            }, 1000)
                    })
            }, 2000)
		} else {
			// yes we can get multiple 2xx response with different tags
			console.log(`UNEXPECTED: call answered ${rs.status} ${rs.reason}`)
            console.log("Please ensure the server sends '100 Trying' but not '200 OK'")
            process.exit(1)
		}
	}
)
