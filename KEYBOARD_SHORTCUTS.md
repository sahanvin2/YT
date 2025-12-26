# Video Player Keyboard Shortcuts

Quick reference for all keyboard shortcuts in the Movia video player.

## Playback Control

| Key | Action | Description |
|-----|--------|-------------|
| **Space** | Play/Pause | Toggle video playback |
| **K** | Play/Pause | Alternative play/pause key |

## Seeking (Time Navigation)

| Key | Action | Description |
|-----|--------|-------------|
| **←** | Rewind 5s | Go back 5 seconds |
| **→** | Forward 5s | Go forward 5 seconds |
| **J** | Rewind 10s | Go back 10 seconds |
| **L** | Forward 10s | Go forward 10 seconds |
| **0** | Seek to 0% | Jump to start of video |
| **1** | Seek to 10% | Jump to 10% of video |
| **2** | Seek to 20% | Jump to 20% of video |
| **3** | Seek to 30% | Jump to 30% of video |
| **4** | Seek to 40% | Jump to 40% of video |
| **5** | Seek to 50% | Jump to halfway point |
| **6** | Seek to 60% | Jump to 60% of video |
| **7** | Seek to 70% | Jump to 70% of video |
| **8** | Seek to 80% | Jump to 80% of video |
| **9** | Seek to 90% | Jump to 90% of video |

## Volume Control

| Key | Action | Description |
|-----|--------|-------------|
| **↑** | Volume Up | Increase volume by 10% |
| **↓** | Volume Down | Decrease volume by 10% |
| **M** | Mute/Unmute | Toggle audio mute |

## Playback Speed

| Key | Action | Description |
|-----|--------|-------------|
| **<** | Slower | Decrease speed by 0.25x |
| **,** | Slower | Alternative slower key |
| **>** | Faster | Increase speed by 0.25x |
| **.** | Faster | Alternative faster key |

**Speed Range**: 0.25x to 2x

## Display Control

| Key | Action | Description |
|-----|--------|-------------|
| **F** | Fullscreen | Toggle fullscreen mode |

## Notes

1. **Shortcuts don't work when typing**: If you're typing in a comment box or search field, keyboard shortcuts are disabled to prevent conflicts.

2. **Click on video first**: If shortcuts aren't working, click on the video player to focus it.

3. **Browser compatibility**: All shortcuts work in Chrome, Firefox, Safari, and Edge.

4. **Mobile devices**: Keyboard shortcuts are not available on mobile devices (touch controls only).

## Tips & Tricks

### Fast Navigation
- Use **J** and **L** to quickly scan through videos (10 second jumps)
- Use **Arrow keys** for fine-tuning (5 second jumps)
- Use **Number keys** to jump to specific parts instantly

### Speed Watching
- Press **>** multiple times to speed up to 2x
- Useful for tutorials, lectures, or catching up on content
- Press **<** to slow down for detailed content

### Volume Management
- Use **↑↓** arrows to adjust volume without reaching for mouse
- Press **M** to quickly mute/unmute during calls or interruptions

### Keyboard-Only Control
You can control the entire video player without touching your mouse:
1. **Space** to play
2. **J/L** to navigate
3. **↑↓** for volume
4. **F** for fullscreen
5. **0-9** to skip around
6. **M** to mute
7. **< >** to change speed

## YouTube Compatibility

These shortcuts are designed to match YouTube's keyboard shortcuts for familiarity:

| Movia | YouTube | Action |
|-------|---------|--------|
| Space/K | Space/K | Play/Pause |
| ←→ | ←→ | Seek 5s |
| J/L | J/L | Seek 10s |
| ↑↓ | ↑↓ | Volume |
| M | M | Mute |
| F | F | Fullscreen |
| 0-9 | 0-9 | Seek % |
| <> | <> | Speed |

## Troubleshooting

### Shortcuts Not Working?

**Problem**: Pressing keys does nothing

**Solutions**:
1. Click on the video player to focus it
2. Make sure you're not in a text input field
3. Refresh the page if player hasn't loaded properly
4. Check browser console for JavaScript errors

**Problem**: Some shortcuts work but not others

**Solutions**:
1. Check if your browser has extensions that override keys
2. Try incognito/private mode
3. Clear browser cache

**Problem**: Fullscreen not working

**Solutions**:
1. Check browser permissions for fullscreen
2. Try clicking fullscreen button instead
3. Some browsers block fullscreen on first page load

## For Developers

### Implementation
Keyboard shortcuts are implemented in `client/src/pages/Watch/Watch.js`:

```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    // Don't trigger if user is typing
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    
    const player = playerRef.current;
    if (!player) return;

    switch(e.key.toLowerCase()) {
      case ' ':
      case 'k':
        e.preventDefault();
        setPlaying(!playing);
        break;
      // ... more cases
    }
  };

  document.addEventListener('keydown', handleKeyPress);
  return () => document.removeEventListener('keydown', handleKeyPress);
}, [playing, volume, muted]);
```

### Adding New Shortcuts
To add new shortcuts:

1. Add case to switch statement in handleKeyPress
2. Update dependencies array if needed
3. Document new shortcut in this file
4. Test in all browsers

## Accessibility

### Screen Readers
- All keyboard shortcuts are accessible
- Focus indicator shows which element is active
- ARIA labels describe controls

### Motor Impairments
- Large target areas for clicking
- Keyboard-only control available
- No time-critical actions required

### Visual Impairments
- High contrast controls
- Large, clear icons
- Keyboard shortcuts don't require seeing screen

## Feedback

If you have suggestions for new keyboard shortcuts or improvements:
1. Contact admin at snawarathne60@gmail.com
2. Open issue on GitHub
3. Use feedback form on website

---

**Pro Tip**: Print this page and keep it next to your keyboard until shortcuts become muscle memory! 🎯

---
**Last Updated**: December 26, 2025
**Version**: 1.0.0
