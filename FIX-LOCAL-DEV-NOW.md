# 🚨 FOUND THE PROBLEM! Local Environment Has Old Key

## The Issue

You're running **`npm run dev` locally**, which means it's **NOT using Firebase Functions** - it's using your **local environment variables**.

Your shell session has the **OLD BLOCKED KEY** set:
```bash
GEMINI_API_KEY=AIzaSyBg-utsnwQpzfH9Y0xOyjYHIojzXohO3Tk  # ❌ OLD BLOCKED KEY
```

But `.env.local` has the **NEW KEY**:
```bash
GEMINI_API_KEY="AIzaSyCZspkBlOGAM6oiSsMKGKJP-b73YPExzE0"  # ✅ NEW KEY
```

**The problem:** Shell environment variables take **precedence** over `.env.local` files!

---

## Quick Fix (30 seconds)

### Option 1: Restart Dev Server (Simplest)

1. **Stop the dev server** (Ctrl+C in the terminal)

2. **Unset the old environment variable**:
   ```bash
   unset GEMINI_API_KEY
   ```

3. **Verify it's gone**:
   ```bash
   echo $GEMINI_API_KEY
   # Should print nothing
   ```

4. **Restart dev server**:
   ```bash
   npm run dev
   ```

5. **Test upload** - should work now! ✅

---

### Option 2: Override in Current Shell

If you don't want to restart:

1. **Set the new key in your current shell**:
   ```bash
   export GEMINI_API_KEY="AIzaSyCZspkBlOGAM6oiSsMKGKJP-b73YPExzE0"
   ```

2. **Restart dev server**:
   ```bash
   # Ctrl+C to stop, then:
   npm run dev
   ```

3. **Test upload** ✅

---

## Why This Happened

### Environment Variable Priority:

1. **Shell environment** (`export GEMINI_API_KEY=...`) ← **HIGHEST PRIORITY**
2. `.env.local` file ← Only used if shell variable doesn't exist
3. `.env` file ← Lowest priority

### What Was Happening:

```
User runs: npm run dev
   ↓
Next.js inherits shell environment
   ↓
Sees: GEMINI_API_KEY=AIzaSyBg... (OLD KEY from shell)
   ↓
Ignores .env.local (because shell var exists)
   ↓
Firebase Function called with OLD KEY
   ↓
Google says: "This key was leaked" ❌
```

---

## Permanent Fix

Make sure the old key isn't permanently set:

```bash
# Check your shell config files
grep -r "GEMINI_API_KEY" ~/.bashrc ~/.bash_profile ~/.zshrc ~/.profile

# If found, remove those lines and restart your terminal
```

---

## Test the Fix

After restarting with `unset GEMINI_API_KEY`:

1. **Verify environment**:
   ```bash
   echo $GEMINI_API_KEY
   # Should print nothing (not the old key!)
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```

3. **Upload Standard Bank statement**

4. **Should work!** ✅

---

## Summary

**Problem**: Shell environment had old blocked key
**Solution**: `unset GEMINI_API_KEY` + restart dev server
**Why**: Shell variables override `.env.local`

**Do this NOW before testing!** 🚀
