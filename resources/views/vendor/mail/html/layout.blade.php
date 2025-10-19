<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>{{ $title ?? config('app.name') }}</title>
        <style>
            @media only screen and (max-width: 600px) {
                .inner-body {
                    width: 100% !important;
                }

                .footer {
                    width: 100% !important;
                }
            }

            @media only screen and (max-width: 500px) {
                .button {
                    width: 100% !important;
                }
            }
        </style>
    </head>
    <body style="margin:0; padding:0; width:100%; background:linear-gradient(135deg,#eef5ff,#f8fbff); font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#0b1220;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:linear-gradient(135deg,#eef5ff,#f8fbff); padding:32px 0;">
            <tr>
                <td align="center">
                    <table width="640" cellpadding="0" cellspacing="0" role="presentation" class="wrapper" style="width:640px; max-width:92%; background:#ffffff; border-radius:20px; box-shadow:0 40px 80px -60px rgba(25, 61, 135, 0.45); overflow:hidden;">
                        @isset($header)
                            <tr>
                                <td>
                                    {{ $header }}
                                </td>
                            </tr>
                        @endisset

                        <tr>
                            <td class="body" width="100%" cellpadding="0" cellspacing="0" style="padding:48px 40px;">
                                <table class="inner-body" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                        <td class="content-cell">
                                            {{ Illuminate\Mail\Markdown::parse($slot) }}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        @isset($subcopy)
                            <tr>
                                <td style="padding:0 40px 32px;">
                                    <table class="subcopy" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #e0e7ff; padding-top:18px;">
                                        <tr>
                                            <td style="font-size:12px; line-height:1.6; color:#6a7aa6; border: 1px solid #e0e7ff;">
                                                {{ Illuminate\Mail\Markdown::parse($subcopy) }}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        @endisset

                        @isset($footer)
                            <tr>
                                <td>
                                    {{ $footer }}
                                </td>
                            </tr>
                        @endisset
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
