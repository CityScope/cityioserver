mod handlers;
mod model;
mod redis_helper;

use actix_cors::Cors;
use actix_redis::RedisActor;
use actix_web::{middleware, web, App, HttpServer};
use dotenv;
use std::env;

use handlers::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    std::env::set_var(
        "RUST_LOG",
        "actix_web=trace,actix_redis=trace,cityio=trace",
    );
    env_logger::init();

    HttpServer::new(|| {
        let address = format!(
            "{}:{}",
            env::var("REDIS_ADDR").unwrap(),
            env::var("REDIS_PORT").unwrap()
        );

        let redis_addr = RedisActor::start(&address);

        // TODO: change this
        let cors = Cors::permissive();

        App::new()
            .data(redis_addr)
            .wrap(middleware::Logger::default())
            .wrap(cors)
            .service(
                web::resource("/api/tables/list")
                .route(web::get().to(table::list_head)), // .route(web::get().to(list_users))
            )
            .service(
                web::resource("/api/table/{table_name}")
                .route(web::get().to(table::get)), // .route(web::get().to(list_users))
            )
            .service(
                web::resource("/api/table/update/{table_name}")
                .route(web::post().to(table::post)), // .route(web::get().to(list_users))
            )
            .service(
                web::resource("/api/table/{table_name}/{tail:.*}")
                .route(web::get().to(table::deep_get)), // .route(web::get().to(list_users))
            )
            .service(
                web::resource("/api/table/update/{name}/{tail:.*}")
                .route(web::post().to(table::deep_post)), // .route(web::get().to(list_users))
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}