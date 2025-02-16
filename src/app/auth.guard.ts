import { CanActivateFn } from '@angular/router';
import { fetchUserAttributes } from 'aws-amplify/auth';

export const authGuard: CanActivateFn = async (route, state) => {
  try{
    const user = await fetchUserAttributes()
    if(user){
      return true
    }else {
      alert('Something went wrong, no user logged in')
      return false;
    }
  }
  catch(e:any){
    alert(e.message)
    return false;
  }
};
