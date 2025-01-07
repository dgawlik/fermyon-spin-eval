import { ResponseBuilder, Kv } from "@fermyon/spin-sdk";



export async function handler(req, res) {

    let store = Kv.openDefault()


    let q = (new URL(req.url)).searchParams;

    console.log(`Received request ${req.method} ${req.url} ${q}`)


    switch (req.method) {
        case "POST":
          if (req.url.includes('/statemachine/submit')) {

            let body = await req.json()
            let number = body.number
            let request_id = body.id

            let exists = await store.get(request_id)

            if (exists) {
                let result = await store.get(request_id)
                console.log(`Serving request_id=${request_id}} from cache --> ${result}`)
                res.status(200)
                res.set("Content-Type", "application/json")
                res.send(result)
            } else {
                console.log(`Requesting computation for request_id=${request_id}`)
                let computeResult = await fetch('http://factorization-compute.spin.internal', {
                    'method': 'POST',
                    'body': JSON.stringify({
                        'number': number,
                        'id': request_id
                    }), 
                    'headers': {
                        'Content-Type': 'application/json'
                    },
                })

                let result = await computeResult.json()

                console.log(`Received result for request_id=${request_id} --> ${result}`)

                await store.set(request_id, result)
                res.status(200)
                res.set("Content-Type", "application/json")
                res.send(JSON.stringify(result))
            }

          } else {
            res.status(404)
            res.set("Content-Type", "text/plain")
            res.send("Not found")
          }
        break;
        case "GET":
           if (req.url.includes('/statemachine/status')) {
              if (q.get('id')) {
                  let request_id = q.get('id')
                  console.log(`Received status request for request_id=${request_id}`)
                  let exists = await store.get(request_id)
                  if (exists) {
                      res.status(200)
                      res.set("Content-Type", "application/json")
                      res.send(exists)
                  } else {
                      res.status(404)
                      res.set("Content-Type", "text/plain")
                      res.send("Not found")
                  }
              }

              res.status(200)
              res.set("Content-Type", "text/plain")
              res.send("OK")

           } else {
              res.status(404)
              res.set("Content-Type", "text/plain")
              res.send("Not found")
           }
        break;
        default:
            res.status(405)
            res.set("Content-Type", "text/plain")
            res.send("Method not allowed")
    }
}
