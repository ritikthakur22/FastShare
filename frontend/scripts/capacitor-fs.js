function saveFileToCapacitor(file, fileName) {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform() || !window.Capacitor.Plugins.Filesystem) return false;
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
        let base64data = reader.result;
        if (base64data.indexOf(',') !== -1) {
            base64data = base64data.split(',')[1];
        }
        try {
            // Ask for permissions first
            const perm = await window.Capacitor.Plugins.Filesystem.requestPermissions();
            if (perm.publicStorage === 'denied') {
                window.Capacitor.Plugins.Toast.show({text: 'Permission denied to save file.'});
                return;
            }

            const directory = localStorage.getItem('setting-gallery') === 'true' && file.type && file.type.startsWith('image/')
                ? 'PICTURES' 
                : 'DOCUMENTS';
            
            await window.Capacitor.Plugins.Filesystem.writeFile({
                path: fileName,
                data: base64data,
                directory: directory,
                recursive: true
            });
            window.Capacitor.Plugins.Toast.show({text: 'Saved ' + fileName});
        } catch (e) {
            console.error('Filesystem write error', e);
            window.Capacitor.Plugins.Toast.show({text: 'Failed to save ' + fileName});
        }
    };
    return true;
}
