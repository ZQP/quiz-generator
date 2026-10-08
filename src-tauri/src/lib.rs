#[tauri::command]
async fn fetch_web_content(url: String) -> Result<String, String> {
  let client = reqwest::Client::builder()
    .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ZQPQuizGenerator/0.2.3")
    .build()
    .map_err(|e| e.to_string())?;

  let res = client.get(&url)
    .send()
    .await
    .map_err(|e| format!("Fehler beim Abrufen der Webadresse: {}", e))?;

  if !res.status().is_success() {
    return Err(format!("Die Website antwortete mit Status: {}", res.status()));
  }

  let text = res.text().await.map_err(|e| format!("Fehler beim Lesen des Inhalts: {}", e))?;
  Ok(text)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![fetch_web_content])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
