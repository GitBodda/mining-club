# Admin Setup Guide - BlockMint App

## Admin Access Configuration

### Authorized Admin Emails
The following emails have admin access:
1. `abdohassan777@gmail.com`
2. `info@hardisk.co`

## Setting Up Admin Access

### Step 1: Create Firebase Account
1. Go to your app's sign-up page
2. Register with one of the authorized admin emails:
   - `abdohassan777@gmail.com` OR
   - `info@hardisk.co`
3. Verify your email through Firebase

### Step 2: Grant Admin Role in Firebase Console

#### Option A: Using Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** > **Users**
4. Find the user with admin email
5. Click on the user
6. Go to **Custom claims** tab
7. Add custom claim:
   ```json
   {
     "admin": true,
     "role": "admin"
   }
   ```

#### Option B: Using Firebase Admin SDK (via server script)
1. SSH into your server or run locally
2. Create a script file `scripts/set-admin.ts`:

```typescript
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const app = initializeApp({
  credential: /* your service account */
});

async function setAdminClaim(email: string) {
  try {
    const user = await getAuth(app).getUserByEmail(email);
    await getAuth(app).setCustomUserClaims(user.uid, {
      admin: true,
      role: 'admin'
    });
    console.log(`✅ Admin claims set for ${email}`);
  } catch (error) {
    console.error('Error setting admin claims:', error);
  }
}

// Set admin for info@hardisk.co
setAdminClaim('info@hardisk.co');
```

3. Run the script:
```bash
npx tsx scripts/set-admin.ts
```

### Step 3: Verify Admin Access

1. **Login to the app** with your admin email
2. **Open the hamburger menu** (top-left icon)
3. Look for **"Admin Panel"** menu item with shield icon
4. Click it to access the admin panel

### Step 4: Access Admin Panel Directly (Alternative)

If the menu item doesn't appear:
1. Navigate to: `https://your-app-domain.com`
2. Login with admin credentials
3. The app will detect admin status automatically
4. Access admin through hamburger menu

## Admin Panel Features

### Available Functions:
- **User Management**: View, edit, suspend users
- **Wallet Management**: View and modify user balances
- **Mining Contracts**: Create, edit, delete mining packages
- **Transaction History**: Monitor all transactions
- **System Settings**: Configure app-wide settings
- **Analytics Dashboard**: View app metrics

### Security Notes:
- ⚠️ Admin access is restricted by **both** custom claims AND email check
- The email must be in the authorized list (server-side and client-side)
- Unauthorized access attempts are logged
- Always logout when finished

## Troubleshooting

### Issue: "Admin Panel" not showing in menu
**Solution:**
1. Verify your email is exactly: `info@hardisk.co` or `abdohassan777@gmail.com`
2. Check Firebase custom claims are set correctly
3. Clear browser cache and reload
4. Logout and login again

### Issue: "Admin access restricted" error
**Solution:**
1. Ensure custom claims include: `admin: true` and `role: "admin"`
2. Verify email matches exactly (no typos, case-sensitive)
3. Check server logs for authentication attempts

### Issue: Data not saving in production
**Solution:**
1. Check Firebase Firestore rules allow admin writes
2. Verify PostgreSQL database connection (if using)
3. Check server logs for error messages
4. Ensure proper authentication token is being sent

## Environment Variables Required

Make sure these are set in your production environment:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"

# Database
DATABASE_URL=your-postgresql-connection-string

# Master Wallet (optional for HD wallet features)
MASTER_WALLET_MNEMONIC=your-24-word-mnemonic
```

## Firebase Console Access

1. Go to: https://console.firebase.google.com
2. Select your project
3. Useful sections for admin:
   - **Authentication**: Manage users, set custom claims
   - **Firestore**: View/edit database
   - **Analytics**: Monitor usage
   - **Hosting**: Deploy updates

## Support

If you need help setting up admin access:
1. Check this guide first
2. Review server logs: `pm2 logs` or check DigitalOcean logs
3. Test Firebase authentication in Firebase Console
4. Verify environment variables are set correctly

## Security Best Practices

- ✅ Use strong passwords for admin accounts
- ✅ Enable 2FA on Firebase account
- ✅ Never share admin credentials
- ✅ Regularly review admin action logs
- ✅ Keep Firebase SDK and dependencies updated
- ✅ Monitor unauthorized access attempts

---

**Last Updated**: January 8, 2026
**Admin Emails**: abdohassan777@gmail.com, info@hardisk.co
