use spin_sdk::http::{IntoResponse, Request, Response};
use spin_sdk::http_component;

use serde::{Serialize, Deserialize};


#[derive(Serialize, Deserialize)]
struct ComputeRequest {
    number: u64,
    id: String,
}

#[derive(Serialize, Deserialize)]
struct ComputeResponse {
    factors: Vec<u64>,
    id: String,
}


fn factorize(n: u64) -> Vec<u64> {
    let mut factors = Vec::new();
    let mut n = n;
   
    while n > 1 {
        for i in 2..=n {
            if n % i == 0 {
                factors.push(i);
                n /= i;
                break;
            }
        }
    }

    factors
}


#[http_component]
fn handle_factorization_compute(req: Request) -> anyhow::Result<impl IntoResponse> {
    println!("Handling request to {:?}", req.header("spin-full-url"));

    let body = req.body();

    let compute_request: ComputeRequest = serde_json::from_slice(body)?;

    println!("Received request to compute factorization of {} with id {}", compute_request.number, compute_request.id);


    let factors = factorize(compute_request.number);

    let compute_response = ComputeResponse {
        factors,
        id: compute_request.id,
    };


    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(serde_json::to_string(&compute_response)?)
        .build())
}
