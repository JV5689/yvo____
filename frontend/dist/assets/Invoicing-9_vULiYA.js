import"./check-DFnNU-an.js";import"./chevron-down-CdSFU4kF.js";import"./TemplateDesigner-DMimUD2k.js";import{t as e}from"./CompanyTemplates-Do4OH3Aq.js";import{t}from"./download-BzyGkGQe.js";import{t as n}from"./file-text-B2WNMZFQ.js";import"./indian-rupee-D9r3LX0U.js";import{t as r}from"./InvoiceBuilder-Drl2VbDC.js";import"./pen-BFj2HDKx.js";import{t as i}from"./plus-CPHmmtku.js";import{t as a}from"./rotate-ccw-B93-qTVh.js";import"./save-8Q1cfiTt.js";import{t as o}from"./search-lwbj8Glc.js";import"./settings-Dcg5YdgF.js";import{t as s}from"./trash-2-HDLdPKZq.js";import"./users-D-VKxtdI.js";import{A as c,T as l,a as u,f as d,i as f,t as p}from"./index-DBWcoL5f.js";import{t as m}from"./Modal-CDqxz6k-.js";import"./InvoiceRenderer-Bw_6blnv.js";import{t as h}from"./html2pdf-BfvCYX52.js";var g=c(l(),1),_=c(h(),1),v=u();function y(){let{alert:c,confirm:l,prompt:u,toast:h}=p(),[y,b]=(0,g.useState)(``),[x,S]=(0,g.useState)([]),[C,w]=(0,g.useState)(!0),[T,E]=(0,g.useState)(!1),[D,O]=(0,g.useState)(null),[k,A]=(0,g.useState)(!1),[j,M]=(0,g.useState)(`invoices`),[N,P]=(0,g.useState)(!1),[F,I]=(0,g.useState)({invoiceId:``,reason:``,items:[]}),[L,R]=(0,g.useState)(null);(0,g.useEffect)(()=>{q(),z()},[k]);let z=async()=>{try{R((await f.get(`/company/config`)).data.company)}catch{console.error(`Failed to load company config`)}},[B,V]=(0,g.useState)(`all`),[H,U]=(0,g.useState)(``),[W,G]=(0,g.useState)(``),K=e=>{let t=new Date(e.date||e.createdAt||Date.now()),n=new Date;if(!(e.customerName?.toLowerCase().includes(y.toLowerCase())||e.invoiceNumber?.toLowerCase().includes(y.toLowerCase()))||H&&new Date(H)>t)return!1;if(W){let e=new Date(W);if(e.setHours(23,59,59,999),e<t)return!1}if(B===`this_month`)return t.getMonth()===n.getMonth()&&t.getFullYear()===n.getFullYear();if(B===`last_month`){let e=new Date;return e.setMonth(n.getMonth()-1),t.getMonth()===e.getMonth()&&t.getFullYear()===e.getFullYear()}return B===`this_year`?t.getFullYear()===n.getFullYear():!0},q=async()=>{try{w(!0);let e=localStorage.getItem(`companyId`);S((await f.get(`/invoices`,{params:{companyId:e,isDeleted:k}})).data)}catch(e){console.error(`Failed to load invoices`,e)}finally{w(!1)}},J=e=>{O(e),E(!0)},Y=(e,t)=>{e.stopPropagation();let n=document.createElement(`div`);n.style.width=`210mm`,n.style.padding=`10mm`,n.style.background=`white`,n.style.color=`black`;let r=t.items.reduce((e,t)=>e+(t.total||0),0),i=t.taxRate===void 0?10:t.taxRate,a=r*(i/100),o=r+a,s=t.items.map(e=>`
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 15px; color: #334155; font-size: 13px;">${e.description||`Item`}</td>
                <td style="padding: 12px 15px; text-align: center; color: #64748b; font-size: 13px;">${e.quantity}</td>
                <td style="padding: 12px 15px; text-align: right; color: #64748b; font-size: 13px;">₹${e.price?.toFixed(2)}</td>
                <td style="padding: 12px 15px; text-align: right; color: #0f172a; font-weight: 600; font-size: 13px;">₹${e.total?.toFixed(2)}</td>
            </tr>
        `).join(``);n.innerHTML=`
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
                
                <!-- Accent Bar -->
                <div style="height: 15px; background: #312e81; margin-bottom: 30px;"></div>

                <div style="padding: 0 10px;">
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 50px;">
                        <div style="width: 50%;">
                            ${L?.logo?`<img src="${L.logo}" style="height: 80px; margin-bottom: 15px; display: block;" />`:``}
                            <h2 style="margin: 0; color: #0f172a; font-size: 20px;">${L?.name||`YVO Company`}</h2>
                            <p style="margin: 5px 0 0; font-size: 13px; color: #64748b;">
                                ${L?.address||`123 Business St`}<br/>
                                ${L?.email?`${L.email}<br/>`:``}
                                ${L?.phone?`${L.phone}<br/>`:``}
                                ${L?.website?`${L.website}`:``}
                            </p>
                        </div>
                        <div style="width: 40%; text-align: right;">
                            <h1 style="font-size: 42px; font-weight: 900; color: #e2e8f0; margin: 0; letter-spacing: -2px;">INVOICE</h1>
                            <div style="margin-top: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Invoice #</span>
                                    <span style="font-family: monospace; font-weight: bold; color: #334155;">${t.invoiceNumber}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Date</span>
                                    <span style="font-size: 13px; font-weight: 500;">${new Date(t.date).toLocaleDateString()}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Status</span>
                                    <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; background: #e2e8f0; border-radius: 4px;">${t.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Client Info -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 50px; padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                        <div style="width: 45%;">
                            <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Bill To</span>
                            <h3 style="margin: 0 0 5px; font-size: 16px; color: #0f172a;">${t.customerName}</h3>
                            <p style="margin: 0; font-size: 13px; color: #64748b; white-space: pre-wrap;">${t.clientAddress||`Client Address`}</p>
                            ${t.gstNumber?`<p style="margin: 8px 0 0; font-size: 12px; color: #475569;"><strong>GSTIN:</strong> ${t.gstNumber}</p>`:``}
                        </div>
                        <div style="width: 45%;">
                            <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Terms</span>
                            ${t.dueDate?`
                                <div style="margin-bottom: 5px;">
                                    <span style="font-size: 13px; color: #64748b;">Due Date:</span>
                                    <span style="font-weight: bold; color: #0f172a; margin-left: 5px;">${new Date(t.dueDate).toLocaleDateString()}</span>
                                </div>
                            `:`<p style="font-size: 13px; color: #64748b;">Payment due on receipt</p>`}
                        </div>
                    </div>

                    <!-- Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                        <thead>
                            <tr style="background: #1e293b; color: white;">
                                <th style="padding: 12px 15px; text-align: left; font-size: 13px; font-weight: 600; border-radius: 6px 0 0 6px;">Description</th>
                                <th style="padding: 12px 15px; text-align: center; font-size: 13px; font-weight: 600; width: 60px;">Qty</th>
                                <th style="padding: 12px 15px; text-align: right; font-size: 13px; font-weight: 600; width: 100px;">Price</th>
                                <th style="padding: 12px 15px; text-align: right; font-size: 13px; font-weight: 600; width: 100px; border-radius: 0 6px 6px 0;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${s}</tbody>
                    </table>

                    <!-- Totals -->
                    <div style="display: flex; justify-content: flex-end;">
                        <div style="width: 300px; background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
                                <span style="color: #64748b; font-weight: 500;">Subtotal</span>
                                <span style="color: #0f172a; font-weight: 600;">₹${r.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px;">
                                <span style="color: #64748b; font-weight: 500;">Tax (${i}%)</span>
                                <span style="color: #0f172a; font-weight: 600;">₹${a.toFixed(2)}</span>
                            </div>
                            <div style="height: 1px; background: #e2e8f0; margin-bottom: 15px;"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #312e81; font-weight: 700; font-size: 16px;">Total</span>
                                <span style="color: #312e81; font-weight: 800; font-size: 20px;">₹${o.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="font-size: 14px; color: #334155; font-weight: 600; margin: 0 0 5px;">Thank you for your business!</p>
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Please include invoice number on your payment.</p>
                    </div>
                </div>
            </div>
        `,(0,_.default)().from(n).save(`${t.invoiceNumber}.pdf`)},X=async(e,t)=>{e.stopPropagation();let n=await u(`Security Authorization`,`Enter Security Password to Delete Invoice:`,`password`,`Verify Password`,`primary`);if(n)try{let e=localStorage.getItem(`companyId`);if(!(await f.post(`/company/verify-password`,{password:n,companyId:e})).data.valid){await c(`Access Denied`,`Incorrect Password! Access Denied.`,`error`);return}if(!await l(`Delete Invoice`,`Move this invoice to trash?`,`Move to Trash`,`danger`))return;await f.delete(`/invoices/${t}`),q()}catch(e){console.error(e),c(`Delete Failed`,`Verification failed or deletion failed`,`error`)}},Z=async(e,t)=>{e.stopPropagation();try{await f.patch(`/invoices/${t}`,{isDeleted:!1}),q()}catch{c(`Restore Failed`,`Failed to restore invoice`,`error`)}},Q=async e=>{e.preventDefault(),await c(`Return Processed`,`Return processed for Invoice #${F.invoiceNumber||`Unknown`}. Stock adjusted.`,`success`),P(!1)},$=(e,t)=>{e.stopPropagation();let n=document.createElement(`div`);n.style.width=`210mm`,n.style.padding=`20mm`,n.style.fontFamily=`Times New Roman, serif`,n.style.lineHeight=`1.6`,n.style.color=`#000`,n.style.background=`#fff`;let r=new Date().toLocaleDateString(`en-US`,{year:`numeric`,month:`long`,day:`numeric`});n.innerHTML=`
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="text-align: right; margin-bottom: 40px;">
                    <p><strong>${L?.name||`Your Company Name`}</strong><br/>
                    ${L?.address||`Company Address`}<br/>
                    ${L?.email||`email@company.com`} | ${L?.phone||`Phone`}</p>
                </div>

                <div style="margin-bottom: 40px;">
                    <p>${r}</p>
                    <p><strong>To:</strong><br/>
                    ${t.customerName}<br/>
                    ${t.clientAddress||`Client Address`}</p>
                </div>

                <h2 style="text-align: center; text-decoration: underline; margin-bottom: 30px;">SUBJECT: OVERDUE PAYMENT REMINDER - INVOICE #${t.invoiceNumber}</h2>

                <p>Dear ${t.customerName},</p>

                <p>This is a friendly reminder that we have not yet received payment for invoice <strong>#${t.invoiceNumber}</strong>, which was due on <strong>${new Date(t.dueDate).toLocaleDateString()}</strong>.</p>

                <p>The total amount outstanding is <strong>₹${t.grandTotal?.toFixed(2)}</strong>.</p>

                <p>We understand that oversights happen, but we would appreciate it if you could settle this amount at your earliest convenience.</p>

                <p>If you have already sent the payment, please disregard this notice. Otherwise, please remit payment immediately.</p>

                <div style="margin-top: 40px;">
                    <p>Sincerely,</p>
                    <br/>
                    <p><strong>${L?.name||`Accounts Receivable`}</strong></p>
                </div>
            </div>
        `,(0,_.default)().from(n).save(`Due_Letter_${t.invoiceNumber}.pdf`)},ee=e=>{switch(e){case`ISSUED`:return`bg-indigo-100 text-indigo-800 border border-indigo-200`;case`PAID`:return`bg-green-100 text-green-800 border border-green-200`;case`DRAFT`:return`bg-slate-100 text-slate-700 border border-slate-200`;case`SENT`:return`bg-blue-100 text-blue-800 border border-blue-200`;case`OVERDUE`:return`bg-red-100 text-red-800 border border-red-200`;case`CANCELLED`:return`bg-gray-100 text-gray-500 border border-gray-200`;default:return`bg-gray-100 text-gray-800 border border-gray-200`}};return C?(0,v.jsx)(`div`,{className:`p-10 text-center`,children:`Loading invoices...`}):(0,v.jsxs)(`div`,{className:`space-y-6`,children:[(0,v.jsxs)(`div`,{className:`flex flex-col md:flex-row justify-between items-start md:items-center gap-4`,children:[(0,v.jsxs)(`div`,{children:[(0,v.jsx)(`h1`,{className:`text-2xl font-bold text-slate-800`,children:`Invoicing`}),(0,v.jsx)(`p`,{className:`text-sm text-slate-500 mt-1`,children:`Manage invoices, returns, and billing.`})]}),(0,v.jsxs)(`div`,{className:`flex gap-2`,children:[(0,v.jsxs)(`button`,{onClick:()=>P(!0),className:`flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100`,children:[(0,v.jsx)(a,{size:18}),` Return Products`]}),(0,v.jsxs)(`button`,{onClick:()=>window.location.href=`/dashboard/invoices/new`,className:`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm`,children:[(0,v.jsx)(i,{size:18}),` Create Invoice`]})]})]}),(0,v.jsx)(`div`,{className:`border-b border-slate-200`,children:(0,v.jsxs)(`nav`,{className:`-mb-px flex space-x-8`,children:[(0,v.jsx)(`button`,{onClick:()=>M(`invoices`),className:`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${j===`invoices`?`border-indigo-500 text-indigo-600`:`border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300`}`,children:`All Invoices`}),(0,v.jsx)(`button`,{onClick:()=>M(`templates`),className:`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${j===`templates`?`border-indigo-500 text-indigo-600`:`border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300`}`,children:`Invoice Templates`})]})}),j===`invoices`?(0,v.jsxs)(`div`,{className:`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden`,children:[(0,v.jsxs)(`div`,{className:`px-6 py-4 border-b border-slate-200 flex flex-col xl:flex-row justify-between gap-4 items-center`,children:[(0,v.jsxs)(`div`,{className:`flex items-center gap-3 w-full xl:w-auto`,children:[(0,v.jsx)(`h3`,{className:`text-lg font-semibold text-slate-800 whitespace-nowrap`,children:k?`Deleted Invoices`:`All Invoices`}),(0,v.jsx)(`button`,{onClick:()=>A(!k),className:`text-xs px-2 py-1 rounded border whitespace-nowrap ${k?`bg-slate-800 text-white`:`bg-white text-slate-500`}`,children:k?`Back to Active`:`Trash`})]}),(0,v.jsxs)(`div`,{className:`flex flex-col lg:flex-row gap-2 w-full xl:w-auto items-center`,children:[(0,v.jsxs)(`select`,{value:B,onChange:e=>{V(e.target.value),U(``),G(``)},className:`w-full md:w-32 py-2 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500`,children:[(0,v.jsx)(`option`,{value:`all`,children:`All Time`}),(0,v.jsx)(`option`,{value:`this_month`,children:`This Month`}),(0,v.jsx)(`option`,{value:`last_month`,children:`Last Month`}),(0,v.jsx)(`option`,{value:`this_year`,children:`This Year`})]}),(0,v.jsxs)(`div`,{className:`flex items-center gap-2 w-full md:w-auto`,children:[(0,v.jsx)(`input`,{type:`date`,value:H,onChange:e=>{U(e.target.value),V(`custom`)},className:`w-full md:w-auto py-2 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500`,placeholder:`From`}),(0,v.jsx)(`span`,{className:`text-slate-400`,children:`-`}),(0,v.jsx)(`input`,{type:`date`,value:W,onChange:e=>{G(e.target.value),V(`custom`)},className:`w-full md:w-auto py-2 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500`})]}),(0,v.jsxs)(`div`,{className:`relative w-full md:w-64`,children:[(0,v.jsx)(o,{className:`absolute left-3 top-2.5 h-4 w-4 text-slate-400`}),(0,v.jsx)(`input`,{type:`text`,placeholder:`Search invoice # or client...`,value:y,onChange:e=>b(e.target.value),className:`w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500`})]})]})]}),(0,v.jsx)(`div`,{className:`overflow-x-auto`,children:(0,v.jsxs)(`table`,{className:`min-w-full divide-y divide-slate-200`,children:[(0,v.jsx)(`thead`,{className:`bg-slate-50 text-xs uppercase font-semibold text-slate-500`,children:(0,v.jsxs)(`tr`,{children:[(0,v.jsx)(`th`,{className:`px-6 py-4 text-left`,children:`Invoice #`}),(0,v.jsx)(`th`,{className:`px-6 py-4 text-left`,children:`Client`}),(0,v.jsx)(`th`,{className:`px-6 py-4 text-left`,children:`Date`}),(0,v.jsx)(`th`,{className:`px-6 py-4 text-left`,children:`Amount`}),(0,v.jsx)(`th`,{className:`px-6 py-4 text-left`,children:`Status`}),(0,v.jsx)(`th`,{className:`px-6 py-4 text-right`,children:`Actions`})]})}),(0,v.jsxs)(`tbody`,{className:`divide-y divide-slate-200`,children:[x.filter(K).map(e=>(0,v.jsxs)(`tr`,{className:`hover:bg-slate-50 cursor-pointer`,onClick:()=>J(e.id),children:[(0,v.jsx)(`td`,{className:`px-6 py-4 text-sm font-medium text-indigo-600`,children:e.invoiceNumber}),(0,v.jsx)(`td`,{className:`px-6 py-4 text-sm text-slate-600`,children:e.customerName}),(0,v.jsx)(`td`,{className:`px-6 py-4 text-sm text-slate-500`,children:new Date(e.date||Date.now()).toLocaleDateString()}),(0,v.jsxs)(`td`,{className:`px-6 py-4 text-sm font-bold text-slate-900`,children:[`₹`,e.grandTotal?.toFixed(2)]}),(0,v.jsx)(`td`,{className:`px-6 py-4`,children:(0,v.jsx)(`span`,{className:`px-2 py-1 rounded-full text-xs font-bold ${ee(e.status)}`,children:e.status})}),(0,v.jsx)(`td`,{className:`px-6 py-4 text-right flex justify-end gap-2`,children:k?(0,v.jsx)(`button`,{onClick:t=>Z(t,e.id),className:`text-indigo-600 text-xs font-bold`,children:`Restore`}):(0,v.jsxs)(v.Fragment,{children:[(e.status===`OVERDUE`||e.status===`PENDING`)&&(0,v.jsx)(`button`,{onClick:t=>$(t,e),className:`p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition`,title:`Generate Due Letter`,children:(0,v.jsx)(n,{size:18})}),(0,v.jsx)(`button`,{onClick:t=>Y(t,e),className:`p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition`,children:(0,v.jsx)(t,{size:18})}),(0,v.jsx)(`button`,{onClick:t=>X(t,e.id),className:`p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition`,children:(0,v.jsx)(s,{size:18})})]})})]},e.id)),x.length===0&&(0,v.jsx)(`tr`,{children:(0,v.jsx)(`td`,{colSpan:`6`,className:`p-8 text-center text-slate-500`,children:`No invoices found.`})})]})]})})]}):j===`templates`?(0,v.jsx)(`div`,{className:`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6`,children:(0,v.jsx)(e,{})}):null,N&&(0,v.jsx)(`div`,{className:`fixed inset-0 bg-black/50 flex items-center justify-center z-50`,children:(0,v.jsxs)(`div`,{className:`bg-white rounded-xl p-6 w-full max-w-md`,children:[(0,v.jsxs)(`div`,{className:`flex items-center gap-2 mb-4 text-amber-600`,children:[(0,v.jsx)(d,{size:24}),(0,v.jsx)(`h2`,{className:`text-xl font-bold text-slate-900`,children:`Process Return`})]}),(0,v.jsx)(`p`,{className:`text-sm text-slate-500 mb-6`,children:`Record returned items to adjust inventory and issue credit.`}),(0,v.jsxs)(`form`,{onSubmit:Q,className:`space-y-4`,children:[(0,v.jsxs)(`div`,{children:[(0,v.jsx)(`label`,{className:`block text-sm font-medium text-slate-700 mb-1`,children:`Invoice Number`}),(0,v.jsx)(`input`,{required:!0,className:`w-full border border-slate-300 p-2 rounded-lg`,placeholder:`INV-001`,onChange:e=>I({...F,invoiceNumber:e.target.value})})]}),(0,v.jsxs)(`div`,{children:[(0,v.jsx)(`label`,{className:`block text-sm font-medium text-slate-700 mb-1`,children:`Reason for Return`}),(0,v.jsxs)(`select`,{className:`w-full border border-slate-300 p-2 rounded-lg`,children:[(0,v.jsx)(`option`,{children:`Damaged Goods`}),(0,v.jsx)(`option`,{children:`Wrong Item Sent`}),(0,v.jsx)(`option`,{children:`Customer Changed Mind`})]})]}),(0,v.jsxs)(`div`,{children:[(0,v.jsx)(`label`,{className:`block text-sm font-medium text-slate-700 mb-1`,children:`Items / Notes`}),(0,v.jsx)(`textarea`,{className:`w-full border border-slate-300 p-2 rounded-lg h-24`,placeholder:`List items returned...`})]}),(0,v.jsxs)(`div`,{className:`flex justify-end gap-2 mt-6`,children:[(0,v.jsx)(`button`,{type:`button`,onClick:()=>P(!1),className:`px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg`,children:`Cancel`}),(0,v.jsx)(`button`,{type:`submit`,className:`px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium`,children:`Confirm Return`})]})]})]})}),(0,v.jsx)(m,{isOpen:T,onClose:()=>E(!1),title:D?`Invoice Details`:`New Invoice`,maxWidth:`max-w-6xl`,children:(0,v.jsx)(r,{invoiceId:D,onClose:()=>E(!1)},D)})]})}export{y as default};