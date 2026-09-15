import React from "react";
import UsermanagementHeader from "../components/usermanagement/UseramangementHeader"
import UserManagementTable from "../components/usermanagement/UserManagementTable";


export default function UserManagement() {

    return(
        <div>
            <div className="mb-4">
            <UsermanagementHeader/>
            </div>
            <UserManagementTable/> 
            
        </div>
    )
}