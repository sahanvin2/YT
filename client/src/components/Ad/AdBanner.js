import React, { useEffect, useRef } from 'react';
import './AdBanner.css';

// Initialize window.atOptions globally to prevent undefined errors
if (typeof window !== 'undefined' && !window.atOptions) {
    window.atOptions = {};
}

const AdBanner = ({ location }) => {
    const adContainerRef = useRef(null);
    const adLoadedRef = useRef(false);
    const scriptLoadedRef = useRef(false);

    useEffect(() => {
        // Skip if already loaded or container doesn't exist
        if (adLoadedRef.current || !adContainerRef.current) return;

        // Use different ad keys based on location and size
        // 728x90 banner ad key for most locations
        const bannerAdKey = 'f3d1a518f166a74bea90e44208c34ab0';
        // 300x250 sidebar ad key (keep old one for sidebar until new one is provided)
        const sidebarAdKey = '7a12bf219eb0e1cf100dc7b56654f792';
        
        // Determine which ad key to use based on location
        const isSidebar = location === 'sidebar' || location === 'download-modal-sidebar';
        const adKey = isSidebar ? sidebarAdKey : bannerAdKey;
        
        // Set up ad options FIRST - this must be done before script loads
        // This matches the original HTML code structure
        // Ensure window.atOptions is always initialized
        if (typeof window !== 'undefined') {
            // Double check initialization (in case of race conditions)
            if (!window.atOptions) {
                window.atOptions = {};
            }
            
            // Create ad configuration - this tells the script what to do
            // Adjust size based on location (sidebar needs smaller ads)
            let adWidth = 728;
            let adHeight = 90;
            
            // Sidebar locations need smaller ads (300x250 or 300x600)
            if (isSidebar) {
                adWidth = 300;
                adHeight = 250; // Medium Rectangle - most common sidebar ad size
            }
            
            try {
                window.atOptions[adKey] = {
                    'key': adKey,
                    'format': 'iframe',
                    'height': adHeight,
                    'width': adWidth,
                    'params': {}
                };
            } catch (error) {
                console.error('Error setting atOptions:', error);
                // Re-initialize if there was an error
                window.atOptions = {};
                window.atOptions[adKey] = {
                    'key': adKey,
                    'format': 'iframe',
                    'height': adHeight,
                    'width': adWidth,
                    'params': {}
                };
            }
        }

        // Create container ID - the script looks for containers with ID: container-{key}
        // IMPORTANT: This ad network expects the exact format: container-{key}
        // However, if multiple ads use the same key, only the first one will work
        // For multiple instances, we need to use unique IDs but the script may not find them
        // Solution: Use the standard format and let the script handle multiple containers
        const containerId = `container-${adKey}`;
        
        // If this is not the first instance, append a unique suffix
        const existingContainers = document.querySelectorAll(`[id^="container-${adKey}"]`).length;
        const finalContainerId = existingContainers > 0 
            ? `container-${adKey}-${location}-${existingContainers}` 
            : containerId;
        
        adContainerRef.current.id = finalContainerId;
        
        // Set data attributes for the script to find
        adContainerRef.current.setAttribute('data-ad-container', finalContainerId);
        adContainerRef.current.setAttribute('data-ad-key', adKey);
        adContainerRef.current.setAttribute('data-ad-format', 'iframe');

        // Function to load the ad script
        const loadAdScript = () => {
            // Check if script is already loaded globally (check for both ad keys)
            const existingScript = document.querySelector(`script[src*="${adKey}/invoke.js"]`) ||
                                   document.querySelector(`script[src*="${bannerAdKey}/invoke.js"]`) ||
                                   document.querySelector(`script[src*="${sidebarAdKey}/invoke.js"]`);
            
            if (!existingScript && !scriptLoadedRef.current) {
                // Create and load the ad script - matching original HTML format
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
                script.async = true;
                
                script.onload = () => {
                    console.log('✅ Ad script loaded successfully for location:', location);
                    scriptLoadedRef.current = true;
                    
                    // The script should automatically find containers with ID: container-{key}
                    // Give it time to process and inject the ad
                    // Check multiple times as the script may need time to scan for containers
                    let checkCount = 0;
                    const maxChecks = 10; // Check for 10 seconds total
                    
                    const checkAd = () => {
                        checkCount++;
                        if (adContainerRef.current) {
                            const hasContent = adContainerRef.current.children.length > 0 || 
                                             adContainerRef.current.innerHTML.trim().length > 0 ||
                                             adContainerRef.current.querySelector('iframe') !== null ||
                                             adContainerRef.current.querySelector('div[style*="iframe"]') !== null;
                            
                            if (hasContent) {
                                console.log('✅ Ad injected successfully into:', containerId);
                                return; // Stop checking
                            } else if (checkCount < maxChecks) {
                                // Continue checking
                                setTimeout(checkAd, 1000);
                            } else {
                                // After max checks, show debug info
                                console.warn('⚠️ Ad container is still empty after', maxChecks, 'seconds');
                                console.log('Container ID:', containerId);
                                console.log('Container element:', adContainerRef.current);
                                console.log('atOptions:', window.atOptions && window.atOptions[adKey] ? window.atOptions[adKey] : 'not set');
                                console.log('All containers with container- prefix:', 
                                    document.querySelectorAll('[id^="container-"]').length);
                                
                                // Try to manually create a placeholder or test iframe
                                if (adContainerRef.current.innerHTML.trim().length === 0) {
                                    console.log('Attempting to show placeholder...');
                                    // Don't show placeholder, let the ad script handle it
                                }
                            }
                        }
                    };
                    
                    // Start checking after 1 second
                    setTimeout(checkAd, 1000);
                };
                
                script.onerror = (error) => {
                    console.error('❌ Failed to load ad script:', error);
                    console.error('Script URL:', `https://www.highperformanceformat.com/${adKey}/invoke.js`);
                };

                // Append to head (matching original HTML behavior)
                document.head.appendChild(script);
            } else {
                // Script already exists - container should be processed automatically
                console.log('ℹ️ Ad script already loaded, waiting for ad injection...');
                scriptLoadedRef.current = true;
                
                // Wait for script to process the container
                setTimeout(() => {
                    if (adContainerRef.current) {
                        const hasContent = adContainerRef.current.children.length > 0 || 
                                         adContainerRef.current.innerHTML.trim().length > 0 ||
                                         adContainerRef.current.querySelector('iframe') !== null;
                        
                        if (hasContent) {
                            console.log('✅ Ad found in container:', containerId);
                        } else {
                            console.warn('⚠️ Container exists but ad not injected yet. Container ID:', containerId);
                            console.log('Make sure container ID matches:', containerId);
                        }
                    }
                }, 2000);
            }
        };

        // Wait for container to be in DOM, then load script
        const timer = setTimeout(() => {
            if (adContainerRef.current) {
                loadAdScript();
                adLoadedRef.current = true;
            }
        }, 200);

        // Cleanup
        return () => {
            clearTimeout(timer);
            adLoadedRef.current = false;
        };
    }, [location]);

    return (
        <div className={`ad-banner ad-${location}`}>
            <div 
                ref={adContainerRef} 
                className="ad-container" 
                style={{ 
                    minHeight: location === 'sidebar' || location === 'download-modal-sidebar' ? '250px' : '90px', 
                    width: '100%', 
                    maxWidth: location === 'sidebar' || location === 'download-modal-sidebar' ? '300px' : '728px', 
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    position: 'relative'
                }}
            >
                {/* Fallback: Show loading indicator if ad hasn't loaded after 3 seconds */}
                {!adLoadedRef.current && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#888',
                        fontSize: '12px',
                        opacity: 0.5
                    }}>
                        Loading ad...
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdBanner;
