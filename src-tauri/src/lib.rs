use winreg::enums::*;
use winreg::RegKey;

#[derive(serde::Serialize)]
struct InstalledApp {
    id: String,
    name: String,
    #[serde(rename = "type")]
    app_type: String,
    path: String,
}

#[tauri::command]
fn launch_workspace(app_paths: Vec<String>, urls: Vec<String>) -> Result<(), String> {
    
    // 1. Browser Execution (Only if URLs exist)
    if !urls.is_empty() {
        let mut browser_args = vec!["/C", "start", "", "brave", "--new-window"];
        let url_refs: Vec<&str> = urls.iter().map(|s| s.as_str()).collect();
        browser_args.extend(url_refs);

        let _ = std::process::Command::new("cmd")
            .args(&browser_args)
            .spawn();
    }

    // 2. Local Applications Execution
    for path in app_paths {
        let mut executable = path.replace("\"", "").trim().to_string();

        // Let Rust expand the environment variables explicitly so Windows can't fail
        if executable.contains("%LOCALAPPDATA%") {
            if let Ok(val) = std::env::var("LOCALAPPDATA") {
                executable = executable.replace("%LOCALAPPDATA%", &val);
            }
        }
        if executable.contains("%APPDATA%") {
            if let Ok(val) = std::env::var("APPDATA") {
                executable = executable.replace("%APPDATA%", &val);
            }
        }

        if executable.is_empty() || executable == "\\" {
            continue; 
        }

        // Fix: Attempt to run the binary directly first.
        let spawn_result = std::process::Command::new(&executable).spawn();
        
        // If direct execution fails, fallback to cmd
        if spawn_result.is_err() {
            let _ = std::process::Command::new("cmd")
                .args(["/C", "start", "", &executable])
                .spawn();
        }
    }

    Ok(())
}
#[tauri::command]
fn scan_installed_apps() -> Result<Vec<InstalledApp>, String> {
    let mut apps = Vec::new();
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let paths = [
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
        "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    ];

    for root_key in [&hklm, &hkcu] {
        for path in &paths {
            if let Ok(uninstall_key) = root_key.open_subkey(path) {
                for key_name_result in uninstall_key.enum_keys() {
                    if let Ok(key_name) = key_name_result {
                        if let Ok(app_key) = uninstall_key.open_subkey(&key_name) {
                            let display_name: String = app_key.get_value("DisplayName").unwrap_or_default();
                            let parent_key: String = app_key.get_value("ParentKeyName").unwrap_or_default();
                            
                            if display_name.is_empty() || !parent_key.is_empty() || display_name.contains("Update") {
                                continue;
                            }

                            let mut exe_path = String::new();
                            let display_icon: String = app_key.get_value("DisplayIcon").unwrap_or_default();
                            
                            if !display_icon.is_empty() {
                                exe_path = display_icon.split(',').next().unwrap_or("").to_string();
                                exe_path = exe_path.trim_matches('"').to_string();
                            } 
                            
                            if !exe_path.to_lowercase().ends_with(".exe") {
                                let install_location: String = app_key.get_value("InstallLocation").unwrap_or_default();
                                if !install_location.is_empty() {
                                    exe_path = install_location;
                                }
                            }

                            if exe_path.is_empty() || exe_path.to_lowercase().contains("unins") {
                                continue;
                            }

                            apps.push(InstalledApp {
                                id: key_name.clone(),
                                name: display_name,
                                app_type: "app".to_string(),
                                path: exe_path,
                            });
                        }
                    }
                }
            }
        }
    }
    Ok(apps)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![launch_workspace, scan_installed_apps])
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
    .expect("error while running tauri application");
}
