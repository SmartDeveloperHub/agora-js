
 /*
    #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
      This file is part of the Smart Developer Hub Project:
        http://www.smartdeveloperhub.org/
      Center for Open Middleware
            http://www.centeropenmiddleware.com/
    #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
      Copyright (C) 2015 Center for Open Middleware.
    #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
      Licensed under the Apache License, Version 2.0 (the "License");
      you may not use this file except in compliance with the License.
      You may obtain a copy of the License at
                http://www.apache.org/licenses/LICENSE-2.0
      Unless required by applicable law or agreed to in writing, software
      distributed under the License is distributed on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
      See the License for the specific language governing permissions and
      limitations under the License.
    #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
*/

 var agora = require("./lib/agora");

 console.log(" * Agora Client: v1.0 Test: ");
 console.log(" - Started at " + new Date());
 console.log(" * Agora Planner: ");
 var gp = '{?s a scm:Repository.}';
 agora.plan.get_plan(gp, function(e){
    if (e.status === "OK") {
        console.log(" - Status: OK for " + gp);
        console.log(" * Agora Fragment: ");
        agora.frag.get_fragment(e.graph, function(r){
            console.log(" * Agora Graph: " + e.status);
            console.log(JSON.stringify(r));
        }, function(e){
            console.log(" Yield: " + e);
        });
    }
    else {
        console.log(" - Status: ERROR (" + e.component + ")");
    }
 });